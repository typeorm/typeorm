import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases
} from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import User from "./entity/User";
import Post from "./entity/Post";
import { EntityManager } from "../../../src/entity-manager/EntityManager";
import { expect } from "chai";

async function createTrigger(em: EntityManager) {
    await em.query(
        `
        CREATE OR REPLACE FUNCTION post_code()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        AS $$
        BEGIN
            NEW.code = md5(random()::text);
            RETURN NEW;
        END $$;
        `
    );
    await em.query(
        `
        CREATE TRIGGER trig_post
        BEFORE INSERT ON post
        FOR EACH ROW
        EXECUTE PROCEDURE post_code();
        `
    );
}

describe("github issues > #3490 Method save does not return the entire model", () => {
    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [User, Post],
            dropSchema: true,
            enabledDrivers: ["postgres"]
        });
    });
    beforeEach(async () => await reloadTestingDatabases(connections));

    it("should retrieve all columns after insert with flag enabled", async () => {
        await Promise.all(
            connections.map(async connection => {
                const em = new EntityManager(connection);

                await createTrigger(em);

                const user = new User();
                user.username = "John";
                await em.save(user);

                const post = new Post();
                post.userId = user.id;
                post.content = "Hello world";
                await em.save(post, { updateAllColumns: true });

                expect(post.code).to.exist;
            })
        );
    });

    it("should not retrieve additional columns by default", async () => {
        await Promise.all(
            connections.map(async connection => {
                const em = new EntityManager(connection);

                await createTrigger(em);

                const user = new User();
                user.username = "Anna";
                await em.save(user);

                const post = new Post();
                post.userId = user.id;
                post.content = "Happy holidays";
                await em.save(post);

                expect(post.code).to.not.exist;
            })
        );
    });

    it("should retrieve additional columns on update with flag enabled", async () => {
        await Promise.all(
            connections.map(async connection => {
                const em = new EntityManager(connection);

                const user = new User();
                user.username = "Edward";
                await em.save(user);

                const updateUser1 = new User();
                updateUser1.id = user.id;
                updateUser1.username = "Emily";
                await em.save(updateUser1);

                expect(updateUser1.createdAt).to.not.exist;

                const updateUser2 = new User();
                updateUser2.id = user.id;
                updateUser2.username = "Charles";
                await em.save(updateUser2, { updateAllColumns: true });

                expect(updateUser2.createdAt).to.exist;
            })
        );
    });

    after(async () => await closeTestingConnections(connections));
});
