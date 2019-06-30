import "reflect-metadata";
import { expect } from "chai";
import { Connection } from "../../../../src/connection/Connection";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases
} from "../../../utils/test-utils";
import { Post } from "./entity/Post";

describe("cube-postgres", () => {
    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"]
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should create correct schema with Postgres' cube type", () =>
        Promise.all(
            connections.map(async connection => {
                const queryRunner = connection.createQueryRunner();
                const schema = await queryRunner.getTable("post");
                await queryRunner.release();
                expect(schema).not.to.be.undefined;
                const cubeColumn = schema!.columns.find(
                    tableColumn =>
                        tableColumn.name === "color" &&
                        tableColumn.type === "cube"
                );
                expect(cubeColumn).to.not.be.undefined;
            })
        ));

    it("should persist cube correctly", () =>
        Promise.all(
            connections.map(async connection => {
                const color = [255, 0, 0];
                const postRepo = connection.getRepository(Post);
                const post = new Post();
                post.color = color;
                const persistedPost = await postRepo.save(post);
                const foundPost = await postRepo.findOne(persistedPost.id);
                expect(foundPost).to.exist;
                expect(foundPost!.color).to.deep.equal(color);
            })
        ));

    it("should update cube correctly", () =>
        Promise.all(
            connections.map(async connection => {
                const color = [255, 0, 0];
                const color2 = [0, 255, 0];
                const postRepo = connection.getRepository(Post);
                const post = new Post();
                post.color = color;
                const persistedPost = await postRepo.save(post);

                await postRepo.update(
                    { id: persistedPost.id },
                    { color: color2 }
                );

                const foundPost = await postRepo.findOne(persistedPost.id);
                expect(foundPost).to.exist;
                expect(foundPost!.color).to.deep.equal(color2);
            })
        ));

    it("should re-save cube correctly", () =>
        Promise.all(
            connections.map(async connection => {
                const color = [255, 0, 0];
                const color2 = [0, 255, 0];
                const postRepo = connection.getRepository(Post);
                const post = new Post();
                post.color = color;
                const persistedPost = await postRepo.save(post);

                persistedPost.color = color2;
                await postRepo.save(persistedPost);

                const foundPost = await postRepo.findOne(persistedPost.id);
                expect(foundPost).to.exist;
                expect(foundPost!.color).to.deep.equal(color2);
            })
        ));

    it("should be able to order cube by euclidean distance", () =>
        Promise.all(
            connections.map(async connection => {
                const color1 = [255, 0, 0];
                const color2 = [255, 255, 0];
                const color3 = [255, 255, 255];

                const post1 = new Post();
                post1.color = color1;
                const post2 = new Post();
                post2.color = color2;
                const post3 = new Post();
                post3.color = color3;
                await connection.manager.save([post1, post2, post3]);

                const posts = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .orderBy("color <-> '(0, 255, 0)'", "DESC")
                    .getMany();

                const postIds = posts.map(post => post.id);
                expect(postIds).to.deep.equal([post1.id, post3.id, post2.id]);
            })
        ));
});
