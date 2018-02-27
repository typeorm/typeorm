import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Post} from "./entity/Post";

describe("uuid-mongodb", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mongodb"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should persist uuid correctly when it is generated non primary column", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getMongoRepository(Post);

        let post = new Post();
        post = await postRepository.save(post);
        const loadedPost = await postRepository.findOneById(post.id);

        expect(loadedPost!.id).to.equal(post.id);
        expect(loadedPost!.uuid).to.be.exist;
    })));
});
