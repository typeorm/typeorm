import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe("github issues > #176 @CreateDateColumn and @UpdateDateColumn does not read back in UTC", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should return dates in utc", () => Promise.all(connections.map(async connection => {

        const post1 = new Post();
        post1.title = "Hello Post #1";
        const testDateString = "2017-01-10T17:38:06.000Z";
        // switch to testDateString because the true equivalent is 1484087886000, not 1484069886663.
        // This fixes fractional seconds rounding error because of the extra 663 milliseconds causing
        // to round up 1 second
        post1.date = new Date(testDateString); // stores "2017-01-10 17:38:06.000" into the database
        post1.localDate = new Date(testDateString); // stores "2017-01-10 22:38:06.000" into the database

        // persist
        await connection.entityManager.persist(post1);

        const loadedPosts1 = await connection.entityManager.findOne(Post, { where: { title: "Hello Post #1" } });
        expect(loadedPosts1!).not.to.be.empty;

        loadedPosts1!.date.toISOString().should.be.equal(testDateString);
        loadedPosts1!.localDate.toISOString().should.be.equal(testDateString);

        // also make sure that local date really was saved as a local date (including timezone)

        const rawPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .where("post.title = :title", { title: "Hello Post #1" })
            .getRawOne();

        // const date = !(rawPost["post_date"] instanceof Date) ? new Date(rawPost["post_date"]) : rawPost["post_date"];
        // date.toISOString().should.be.equal("2017-01-10T12:38:06.000Z");

        const localDate = !(rawPost["post_localDate"] instanceof Date) ? new Date(rawPost["post_localDate"]) : rawPost["post_localDate"];
        localDate.toISOString().should.be.equal(testDateString);
    })));

});
