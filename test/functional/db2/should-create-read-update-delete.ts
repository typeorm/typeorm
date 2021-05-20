import "reflect-metadata";
import { Post } from "./entity/Post";
import { Category } from "./entity/Category";
import { Connection } from "../../../src/connection/Connection";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { expect } from "chai";

describe("DB2 crud", () => {
    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            // __dirname,
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: [
                // "postgres",
                "db2",
                // ""
            ],
        });
        return connections;
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should create new post", async () =>
        Promise.all(
            connections.map(async (connection) => {
                const post = new Post();
                post.title = "Hello Post #1";
                post.subtitle = "Subtitle";
                post.description = "Description";
                const saved = await connection.manager.save(post);

                expect(post.title).to.be.eq(saved.title);
            })
        ));

    it("should create new post with new category", async () =>
        Promise.all(
            connections.map(async (connection) => {
                const category = new Category();
                category.title = "Category title";

                const post = new Post();
                post.title = "Hello Post #1";
                post.subtitle = "Subtitle";
                post.description = "Description";
                post.categories = [category];
                await connection.manager.save(post);

                const result = await connection.manager.findOne(Category, 1, {
                    relations: ["post"],
                });

                expect(result!.post.id).to.be.eq(post.id);
            })
        ));

    it("should update existing post", async () =>
        Promise.all(
            connections.map(async (connection) => {
                const post = new Post();
                post.title = "Title";
                post.subtitle = "Subtitle";
                post.description = "Description";
                const saved = await connection.manager.save(post);

                saved.title = "Another title";
                const updatePost = await connection.manager.save(saved, {
                    reload: true,
                });

                updatePost.subtitle = "Another subtitle";
                const updatedPost = await connection.manager.save(updatePost, {
                    reload: true,
                });

                updatedPost.description = "Another description";
                const result = await connection.manager.save(updatePost, {
                    reload: true,
                });

                expect(saved.title).to.be.eq(result.title);
                expect(updatePost.subtitle).to.be.eq(result.subtitle);
                expect(updatedPost.description).to.be.eq(result.description);
            })
        ));

    it("should list existing post", async () =>
        Promise.all(
            connections.map(async (connection) => {
                const post = new Post();
                post.title = "Title";
                post.subtitle = "Subtitle";
                post.description = "Description";
                await connection.manager.save(post);

                const result = await connection.manager.find(Post, {
                    where: {
                        id: 1,
                    },
                });

                expect(result.length).to.be.eq(1);
                expect(result[0].title).to.be.eq(post.title);
            })
        ));
    it("should list existing post with lock mode (WITH UR)", async () =>
        Promise.all(
            connections.map(async (connection) => {
                const transaction = await connection.transaction(
                    async (entity) => {
                        const post = new Post();
                        post.title = "Title";
                        post.subtitle = "Subtitle";
                        post.description = "Description";
                        await connection.manager.save(post);

                        const result = await entity.find(Post, {
                            where: {
                                id: 1,
                            },
                            transaction: true,
                            lock: {
                                mode: "pessimistic_read",
                            },
                        });

                        expect(result.length).to.be.eq(1);
                        expect(result[0].title).to.be.eq(post.title);
                    }
                );
            })
        ));

    it("should delete existing post", async () =>
        Promise.all(
            connections.map(async (connection) => {
                const post = new Post();
                post.title = "Title";
                post.subtitle = "Subtitle";
                post.description = "Description";
                await connection.manager.save(post);

                await connection.manager.remove(post);
            })
        ));
});
