import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {Post} from "./entity/Post";

describe("github issue > #1397 Spaces at the end of values are removed when inserting", () => {

    let connections: Connection[] = [];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not trim empty spaces when saving", () => Promise.all(connections.map(async connection => {

        const post = new Post();
        post.title = " About My Post   ";
        await connection.manager.save(post);
        post.title.should.be.equal(" About My Post   ");

        const loadedPost = await connection.manager.findOne(Post, { id: 1 });
        expect(loadedPost).not.to.be.undefined;
        loadedPost!.title.should.be.equal(" About My Post   ");
    })));

});
