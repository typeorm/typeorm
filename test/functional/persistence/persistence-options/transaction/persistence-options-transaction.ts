import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Post} from "./entity/Post";
import {Connection} from "../../../../../src/connection/Connection";
// import {expect} from "chai";

describe("persistence > persistence options > transaction", () => {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({ __dirname }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("should disable transaction when option is specified", () => Promise.all(connections.map(async connection => {
        const post = new Post();
        post.title = "Bakhrom";
        post.description = "Hello";
        await connection.manager.save(post, { transaction: false });
        // todo: check if actual transaction query is not executed
    })));

});
