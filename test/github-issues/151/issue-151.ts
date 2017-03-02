import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {PostMetadata} from "./entity/PostMetadata";

describe("github issues > #151 joinAndSelect can't find entity from inverse side of relation", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should cascade persist successfully", () => Promise.all(connections.map(async connection => {

        const category = new Category();
        category.name = "post category";

        const post = new Post();
        post.title = "Hello post";
        post.category = category;

        await connection.entityManager.persist(post);

        const loadedPost = await connection.entityManager.findOneById(Post, 1, {
            join: {
                alias: "post",
                innerJoinAndSelect: {
                    category: "post.category"
                }
            }
        });

        expect(loadedPost).not.to.be.empty;
        loadedPost!.should.be.eql({
            id: 1,
            title: "Hello post",
            category: {
                id: 1,
                name: "post category"
            }
        });

    })));

    it("should cascade remove successfully with uni-directional relation", () => Promise.all(connections.map(async connection => {

        const category = new Category();
        category.name = "post category";

        const post = new Post();
        post.title = "Hello post";
        post.category = category;

        await connection.entityManager.persist(post);

        post.category = null;

        await connection.entityManager.persist(post);

        const loadedPostWithCategory = await connection.entityManager.findOneById(Post, 1, {
            join: {
                alias: "post",
                innerJoinAndSelect: {
                    category: "post.category"
                }
            }
        });

        expect(loadedPostWithCategory).to.be.empty;

        const loadedPostWithoutCategory = await connection.entityManager.findOneById(Post, 1);

        expect(loadedPostWithoutCategory).not.to.be.empty;
        loadedPostWithoutCategory!.should.be.eql({
            id: 1,
            title: "Hello post"
        });

        const loadedCategory = await connection.entityManager.findOneById(Category, 1);
        expect(loadedCategory).to.be.empty;

    })));

    it("should cascade remove successfully with bi-directional relation from owner side", () => Promise.all(connections.map(async connection => {

        const metadata = new PostMetadata();
        metadata.name = "post metadata";

        const post = new Post();
        post.title = "Hello post";
        post.metadata = metadata;

        await connection.entityManager.persist(post);

        post.metadata = null;

        await connection.entityManager.persist(post);

        const loadedPostWithMetadata = await connection.entityManager.findOneById(Post, 1, {
            join: {
                alias: "post",
                innerJoinAndSelect: {
                    metadata: "post.metadata"
                }
            }
        });
        expect(loadedPostWithMetadata).to.be.empty;

        const loadedPostWithoutMetadata = await connection.entityManager.findOneById(Post, 1);
        expect(loadedPostWithoutMetadata).not.to.be.empty;
        loadedPostWithoutMetadata!.should.be.eql({
            id: 1,
            title: "Hello post"
        });

        const loadedMetadata = await connection.entityManager.findOneById(PostMetadata, 1);
        expect(loadedMetadata).to.be.empty;

    })));

});
