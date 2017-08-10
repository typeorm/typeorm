import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe("github issues > #737 Both null and undefined find option should generate IS NULL query", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should return row that publish_time is null value no matter find option is null or undefined", () => Promise.all(connections.map(async connection => {

        const post = new Post();
        post.title = "foo";
        await connection.manager.save(post);

        const loadedPost = await connection.getRepository(Post).findOne({ title: "foo", publish_time: undefined });
        expect(loadedPost!.title, "foo");
        expect(loadedPost!.publish_time, undefined);
        
    })));

});