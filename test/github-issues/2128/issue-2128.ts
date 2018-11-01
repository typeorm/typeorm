import "reflect-metadata";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { Post } from "./entity/Post";
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver";

describe("github issues > #2128 skip preparePersistentValue for value functions", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres", "mysql"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should be able to resolve value functions", () => Promise.all(connections.map(async connection => {

        await connection.createQueryBuilder()
            .insert()
            .into(Post)
            .values({
                title: "First Post",
                meta: {
                    keywords: [
                        "important",
                        "fresh"
                    ]
                }
            })
            .execute();

        const metaAddition = JSON.stringify({
            author: "John Doe"
        });

        await connection.createQueryBuilder()
            .update(Post)
            .set({
                meta: () => connection.driver instanceof PostgresDriver
                    ? `'${metaAddition}'::JSONB || meta::JSONB`
                    : `JSON_MERGE('${metaAddition}', meta)`
            })
            .where("title = :title", {
                title: "First Post"
            })
            .execute();

        const loadedPost = await connection.getRepository(Post).findOne({ title: "First Post" });

        expect(loadedPost!.meta).to.deep.equal({
             author: "John Doe",
             keywords: [
                 "important",
                 "fresh"
            ]
        });

    })));

});
