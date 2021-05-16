import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe("github issues > #3636 synchronize drops (and then re-adds) json column in mariadb", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
        enabledDrivers: ["mariadb"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not drop json column", () => Promise.all(connections.map(async function(connection) {

        const post = new Post();
        post.id = 1;
        post.data = {hello: "world"};
        await connection.manager.save(post);

        await connection.synchronize();

        const loadedPost = await connection.manager.findOne(Post, 1);

        expect(loadedPost).to.be.not.empty;
        expect(loadedPost!.data.hello).to.be.eq("world");
    })));

});
