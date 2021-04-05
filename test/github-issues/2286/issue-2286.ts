import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { Post } from "./entity/Post";
import { Between } from "../../../src";

describe("github issues > #2286 find operators like MoreThan and LessThan doesn't work properly for date fields", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        /* Test not eligible for better-sql where binding Dates is impossible */
        enabledDrivers: ["sqlite"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    
    after(() => closeTestingConnections(connections));

    it("should find a record by its datetime value", () => Promise.all(connections.map(async connection => {
        const start = new Date("2000-01-01");
        const end = new Date("2001-01-01");
        const middle = new Date("2000-06-30");
        const post = new Post();
        post.dateTimeColumn = middle;

        await connection.manager.save(post);

        const postByDateEquals = await connection.manager.findOne(Post, {
            dateTimeColumn: middle
        });
        expect(postByDateEquals).to.not.be.undefined;

        const postByDateBetween = await connection.manager.findOne(Post, {
            dateTimeColumn: Between(start, end)
        });
        expect(postByDateBetween).to.not.be.undefined;
    })));
});