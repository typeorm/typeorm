import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("columns > value-transformer functionality", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should marshal data using the provided value-transformer", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);

        // create and save a post first
        const post = new Post();
        post.title = "About columns";
        post.tags = ["simple", "transformer"];
        await postRepository.save(post);

        // then update all its properties and save again
        post.title = "About columns1";
        post.tags = ["very", "simple"];
        await postRepository.save(post);

        // check if all columns are updated except for readonly columns
        const loadedPost = await postRepository.findOne(1);
        expect(loadedPost!.title).to.be.equal("About columns1");
        expect(loadedPost!.tags).to.deep.eq(["very", "simple"]);

    })));


});
