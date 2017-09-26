import { PostWithCompositeValueObjectIds } from "./entity/PostWithCompositeValueObjectIds";
import { PostWithValueObjectId } from "./entity/PostWithValueObjectId";
import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {PostId} from "./entity/PostId";
import {PostIdPrefix} from "./entity/PostIdPrefix";
import {PostWithEmbeddedPrimaryKey} from "./entity/PostWithEmbeddedPrimaryKey";
import {Category} from "./entity/Category";
import {CategoryId} from "./entity/CategoryId";

describe("columns > value-transformer functionality", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post, PostWithValueObjectId, PostWithCompositeValueObjectIds, PostWithEmbeddedPrimaryKey],
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

    it("should use marshalled primary key when doing lookups", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getRepository(PostWithValueObjectId);

        // create and save a post first
        const postId = PostId.fromString("1");
        const post = new PostWithValueObjectId(postId);
        post.title = "About columns";
        await postRepository.save(post);

        // then update all its properties and save again
        post.title = "About columns1";

        await postRepository.save(post);

        // check if all columns are updated except for readonly columns
        const loadedPost = await postRepository.findOneById(postId);
        expect(loadedPost!.title).to.be.equal("About columns1");
    })));

    it("should use marshalled primary keys when doing lookups with a composite primary key", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getRepository(PostWithCompositeValueObjectIds);

        // create and save a post first
        const postIdPrefix = PostIdPrefix.fromString("abc_");
        const postId = PostId.fromString("1");
        const post = new PostWithCompositeValueObjectIds(postIdPrefix, postId);
        post.title = "About columns";
        await postRepository.save(post);

        // then update all its properties and save again
        post.title = "About columns1";

        await postRepository.save(post);

        // check if all columns are updated except for readonly columns
        const loadedPost = await postRepository.findOneById({
            idPrefix: postIdPrefix,
            id: postId
        });
        expect(loadedPost!.title).to.be.equal("About columns1");
    })));

    it.skip("should use marshalled primary keys when using embeddeds", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getRepository(PostWithEmbeddedPrimaryKey);

        // create and save a post first
        const postId = PostId.fromString("1");
        const categoryId = CategoryId.fromString("2");
        const category = new Category(categoryId, "My awesome category");
        const post = new PostWithEmbeddedPrimaryKey(postId, category);
        post.title = "About embeddeds";
        await postRepository.save(post);

        // then update all its properties and save again
        post.title = "About embeddeds1";

        await postRepository.save(post);

        // check if all columns are updated except for readonly columns
        const loadedPost = await postRepository.findOneById({
            id: postId,
            category: {
                id: categoryId
            }
        });
        expect(loadedPost!.title).to.be.equal("About embeddeds1");
    })));
});
