import "reflect-metadata";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { Post } from "./entity/Post";

describe("github issues > #3395 Transform.from does nothing when column is NULL", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should run transform from if column is null", () => Promise.all(connections.map(async function (connection) {

        const post = new Post();
        post.id = 1;
        await connection.getRepository(Post).save(post);

        const loadedPost = await connection.getRepository(Post).findOne(1);

        loadedPost!.text!.should.be.eq("This is null");
    })));

});
