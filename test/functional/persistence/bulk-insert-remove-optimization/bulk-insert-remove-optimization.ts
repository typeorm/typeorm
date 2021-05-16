import "reflect-metadata";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
// import {expect} from "chai";

describe("persistence > bulk-insert-remove-optimization", function() {

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

    it("should group multiple insert and remove queries", () => Promise.all(connections.map(async connection => {

        const category1 = new Category();
        category1.name = "cat#1";

        const category2 = new Category();
        category2.name = "cat#2";

        const post = new Post();
        post.title = "about post";
        post.categories = [category1, category2];

        await connection.manager.save(post);

        await connection.manager.remove([post, category2, category1]);

        // todo: finish test, e.g. check actual queries
    })));

});
