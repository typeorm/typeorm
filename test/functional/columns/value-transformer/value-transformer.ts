import { PostWithValueObjectId } from "./entity/PostWithValueObjectId";
import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import { PostId } from "./entity/PostId";

describe("columns > value-transformer functionality", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post, PostWithValueObjectId],
        dropSchema: true
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
        const loadedPost = await postRepository.findOneById(1);
        expect(loadedPost!.title).to.be.equal("About columns1");
        expect(loadedPost!.tags).to.deep.eq(["very", "simple"]);

    })));

    it.only("should use marshalled primary key when doing internal lookups", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getRepository(PostWithValueObjectId);

        // create and save a post first
        const post = new PostWithValueObjectId(PostId.fromString("1"));
        post.title = "About columns";
        await postRepository.save(post);

        // then update all its properties and save again
        post.title = "About columns1";

        await postRepository.save(post);

        // check if all columns are updated except for readonly columns
        const loadedPost = await postRepository.findOneById("1");
        expect(loadedPost!.title).to.be.equal("About columns1");
    })));
});
