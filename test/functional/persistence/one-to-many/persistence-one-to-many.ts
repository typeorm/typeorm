import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {FindManyOptions} from "../../../../src/find-options/FindManyOptions";
import {closeTestingConnections, reloadTestingDatabases, createTestingConnections} from "../../../utils/test-utils";

describe("persistence > one-to-many", function() {

    // -------------------------------------------------------------------------
    // Setup
    // -------------------------------------------------------------------------

    let connections: Connection[];
    before(() => {
        return createTestingConnections({
            entities: [Post, Category],
            schemaCreate: true,
            dropSchemaOnConnection: true,
        }).then(all => connections = all);
    });
    after(() => closeTestingConnections(connections));
    beforeEach(() => reloadTestingDatabases(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    describe("add exist element to exist object with empty one-to-many relation and save it", function() {

        it("should contain a new category", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const categoryRepository = connection.getRepository(Category);

            let newCategory = categoryRepository.create();
            newCategory.name = "Animals";
            await categoryRepository.persist(newCategory);

            let newPost = postRepository.create();
            newPost.title = "All about animals";
            await postRepository.persist(newPost);

            newPost.categories = [newCategory];
            await postRepository.persist(newPost);

            const loadedPost = (await postRepository.findOneById(1, {
                join: {
                    alias: "post",
                    innerJoinAndSelect: {
                        categories: "post.categories"
                    }
                }
            }))!;
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost.categories).not.to.be.empty;
            expect(loadedPost.categories![0]).not.to.be.empty;
        })));

    });

    describe("add exist element to new object with empty one-to-many relation and save it", function() {

        it("should contain a new element", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const categoryRepository = connection.getRepository(Category);

            let newCategory = categoryRepository.create();
            newCategory.name = "Animals";
            await categoryRepository.persist(newCategory);

            let newPost = postRepository.create();
            newPost.title = "All about animals";
            newPost.categories = [newCategory];
            await postRepository.persist(newPost);

            const loadedPost = await postRepository.findOneById(1, {
                join: {
                    alias: "post",
                    innerJoinAndSelect: {
                        categories: "post.categories"
                    }
                }
            });
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost!.categories).not.to.be.empty;
            expect(loadedPost!.categories![0]).not.to.be.empty;
        })));

    });

    describe("remove exist element from one-to-many relation and save it", function() {

        it("should have only one category", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const categoryRepository = connection.getRepository(Category);

            let firstNewCategory = categoryRepository.create();
            firstNewCategory.name = "Animals";
            await categoryRepository.persist(firstNewCategory);

            let secondNewCategory = categoryRepository.create();
            secondNewCategory.name = "Insects";
            await categoryRepository.persist(secondNewCategory);

            let newPost = postRepository.create();
            newPost.title = "All about animals";
            await postRepository.persist(newPost);

            newPost.categories = [firstNewCategory, secondNewCategory];
            await postRepository.persist(newPost);

            newPost.categories = [firstNewCategory];
            await postRepository.persist(newPost);

            const loadedPost = await postRepository.findOneById(1, {
                join: {
                    alias: "post",
                    innerJoinAndSelect: {
                        categories: "post.categories"
                    }
                }
            });
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost!.categories).not.to.be.empty;
            expect(loadedPost!.categories![0]).not.to.be.empty;
            expect(loadedPost!.categories![1]).to.be.empty;
        })));

    });
    
    describe("remove all elements from one-to-many relation and save it", function() {

        it("should not have categories since they all are removed", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const categoryRepository = connection.getRepository(Category);

            let firstNewCategory = categoryRepository.create();
            firstNewCategory.name = "Animals";
            await categoryRepository.persist(firstNewCategory);

            let secondNewCategory = categoryRepository.create();
            secondNewCategory.name = "Insects";
            await categoryRepository.persist(secondNewCategory);

            let newPost = postRepository.create();
            newPost.title = "All about animals";
            await postRepository.persist(newPost);

            newPost.categories = [firstNewCategory, secondNewCategory];
            await postRepository.persist(newPost);

            newPost.categories = [];
            await postRepository.persist(newPost);

            const loadedPost = await postRepository.findOneById(1, {
                join: {
                    alias: "post",
                    leftJoinAndSelect: {
                        categories: "post.categories"
                    }
                }
            });
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost!.categories).to.be.empty;
        })));

    });

    describe("set relation to null (elements exist there) from one-to-many relation and save it", function() {

        it("should not have categories since they all are removed", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const categoryRepository = connection.getRepository(Category);

            let firstNewCategory = categoryRepository.create();
            firstNewCategory.name = "Animals";
            await categoryRepository.persist(firstNewCategory);

            let secondNewCategory = categoryRepository.create();
            secondNewCategory.name = "Insects";
            await categoryRepository.persist(secondNewCategory);

            let newPost = postRepository.create();
            newPost.title = "All about animals";
            await postRepository.persist(newPost);

            newPost.categories = [firstNewCategory, secondNewCategory];
            await postRepository.persist(newPost);

            newPost.categories = null; // todo: what to do with undefined?
            await postRepository.persist(newPost);

            const loadedPost = (await postRepository.findOneById(1, {
                join: {
                    alias: "post",
                    leftJoinAndSelect: {
                        categories: "post.categories"
                    }
                }
            }))!;
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost.categories).to.be.empty;
        })));

    });

});
