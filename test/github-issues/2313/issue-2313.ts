import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Post} from "./entity/Post";
import {expect} from "chai";
import {EntityNotFoundError} from "../../../src/error/EntityNotFoundError";

describe("github issues > #2313 - BaseEntity has no findOneOrFail() method", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"]
    }));

    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should find the appropriate record when one exists", async () => {
        // These must run sequentially as we have the global context of the `Post` ActiveRecord class
        for (const connection of connections) {
            Post.useConnection(connection); // change connection each time because of AR specifics

            const post1 = new Post();
            post1.data = 123;
            await post1.save();

            const post2 = new Post();
            post2.data = 456;
            await post2.save();

            const result1 = await Post.findOneOrFail(1);

            result1.data.should.be.eql(123);

            const result2 = await Post.findOneOrFail(2);

            result2.data.should.be.eql(456);
        }
    });

    it("should throw no matching record exists", async () => {
        // These must run sequentially as we have the global context of the `Post` ActiveRecord class
        for (const connection of connections) {
            Post.useConnection(connection); // change connection each time because of AR specifics

            try {
                await Post.findOneOrFail(100);
                expect.fail();
            } catch (e) {
                e.should.be.instanceOf(EntityNotFoundError);
            }
        }
    });

});
