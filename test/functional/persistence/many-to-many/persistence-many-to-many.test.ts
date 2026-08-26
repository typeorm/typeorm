import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { User } from "./entity/User"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

describe("persistence > many-to-many", function () {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            __dirname,
            disabledDrivers: ["spanner"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("add exist element to exist object with empty many-to-many relation and save it and it should contain a new category", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)
                const categoryRepository = dataSource.getRepository(Category)
                const userRepository = dataSource.getRepository(User)

                // save a new category
                const newCategory = categoryRepository.create()
                newCategory.name = "Animals"
                await categoryRepository.save(newCategory)

                // save a new post
                const newPost = postRepository.create()
                newPost.title = "All about animals"
                await postRepository.save(newPost)

                // save a new user
                const newUser = userRepository.create()
                newUser.name = "Dima"
                await userRepository.save(newUser)

                // now add a category to the post and attach post to a user and save a user
                newPost.categories = [newCategory]
                newUser.post = newPost
                await userRepository.save(newUser)

                // load a post
                const loadedUser = await userRepository.findOneOrFail({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser).not.to.be.null
                expect(loadedUser.post).not.to.be.undefined
                expect(loadedUser.post.categories).not.to.be.undefined
            }),
        ))

    it("remove one element from many-to-many relation should remove from the database as well", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)
                const categoryRepository = dataSource.getRepository(Category)
                const userRepository = dataSource.getRepository(User)

                // save a new category
                const category1 = new Category()
                category1.name = "Animals"
                await categoryRepository.save(category1)

                // save a new category
                const category2 = new Category()
                category2.name = "Animals"
                await categoryRepository.save(category2)

                // save a new post
                const newPost = postRepository.create()
                newPost.title = "All about animals"
                await postRepository.save(newPost)

                // save a new user
                const newUser = userRepository.create()
                newUser.name = "Dima"
                await userRepository.save(newUser)

                // now categories to the post inside user and save a user
                newPost.categories = [category1, category2]
                newUser.post = newPost
                await userRepository.save(newUser)

                // load a post
                const loadedUser1 = await userRepository.findOneOrFail({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser1).not.to.be.null
                expect(loadedUser1.post).not.to.be.undefined
                expect(loadedUser1.post.categories).not.to.be.undefined
                expect(loadedUser1.post.categories!.length).to.be.equal(2)

                // now remove added categories
                newPost.categories = [category1]
                newUser.post = newPost
                await userRepository.save(newUser)

                // load a post
                const loadedUser2 = await userRepository.findOneOrFail({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser2).not.to.be.null
                expect(loadedUser2.post).not.to.be.undefined
                expect(loadedUser2.post.categories).not.to.be.undefined
                expect(loadedUser2.post.categories!.length).to.be.equal(1)
            }),
        ))

    it("remove all elements from many-to-many relation should remove from the database as well", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)
                const categoryRepository = dataSource.getRepository(Category)
                const userRepository = dataSource.getRepository(User)

                // save a new category
                const category1 = new Category()
                category1.name = "Animals"
                await categoryRepository.save(category1)

                // save a new category
                const category2 = new Category()
                category2.name = "Animals"
                await categoryRepository.save(category2)

                // save a new post
                const newPost = postRepository.create()
                newPost.title = "All about animals"
                await postRepository.save(newPost)

                // save a new user
                const newUser = userRepository.create()
                newUser.name = "Dima"
                await userRepository.save(newUser)

                // now categories to the post inside user and save a user
                newPost.categories = [category1, category2]
                newUser.post = newPost
                await userRepository.save(newUser)

                // load a post
                const loadedUser1 = await userRepository.findOneOrFail({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser1).not.to.be.null
                expect(loadedUser1.post).not.to.be.undefined
                expect(loadedUser1.post.categories).not.to.be.undefined
                expect(loadedUser1.post.categories!.length).to.be.equal(2)

                // now remove added categories
                newPost.categories = []
                newUser.post = newPost
                await userRepository.save(newUser)

                // load a post
                const loadedUser2 = await userRepository.findOneOrFail({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser2).not.to.be.null
                expect(loadedUser2.post).not.to.be.undefined
                expect(loadedUser2.post.categories!.length).to.be.equal(0)
            }),
        ))

    it("remove all elements (set to null) from many-to-many relation should remove from the database as well", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)
                const categoryRepository = dataSource.getRepository(Category)
                const userRepository = dataSource.getRepository(User)

                // save a new category
                const category1 = new Category()
                category1.name = "Animals"
                await categoryRepository.save(category1)

                // save a new category
                const category2 = new Category()
                category2.name = "Animals"
                await categoryRepository.save(category2)

                // save a new post
                const newPost = postRepository.create()
                newPost.title = "All about animals"
                await postRepository.save(newPost)

                // save a new user
                const newUser = userRepository.create()
                newUser.name = "Dima"
                await userRepository.save(newUser)

                // now categories to the post inside user and save a user
                newPost.categories = [category1, category2]
                newUser.post = newPost
                await userRepository.save(newUser)

                // load a post
                const loadedUser1 = await userRepository.findOneOrFail({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser1).not.to.be.null
                expect(loadedUser1.post).not.to.be.undefined
                expect(loadedUser1.post.categories).not.to.be.undefined
                expect(loadedUser1.post.categories!.length).to.be.equal(2)

                // now remove added categories
                newPost.categories = null
                newUser.post = newPost
                await userRepository.save(newUser)

                // load a post
                const loadedUser2 = await userRepository.findOneOrFail({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser2).not.to.be.null
                expect(loadedUser2.post).not.to.be.undefined
                expect(loadedUser2.post.categories!.length).to.be.equal(0)
            }),
        ))

    // regression test for github issue #12710
    it("should not remove junction rows of an entity saved in the same call without its relation loaded", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)
                const categoryRepository = dataSource.getRepository(Category)

                const category1 = new Category()
                category1.name = "Animals"
                await categoryRepository.save(category1)

                const category2 = new Category()
                category2.name = "Nature"
                await categoryRepository.save(category2)

                const post1 = new Post()
                post1.title = "post #1"
                post1.categories = [category1]

                const post2 = new Post()
                post2.title = "post #2"
                post2.categories = [category2]
                await postRepository.save([post1, post2])

                // load post1 WITH its categories and post2 WITHOUT them,
                // so post2's categories stay undefined (not loaded)
                const loadedPost1 = await postRepository.findOneOrFail({
                    where: { id: post1.id },
                    relations: { categories: true },
                })
                const loadedPost2 = await postRepository.findOneOrFail({
                    where: { id: post2.id },
                })

                loadedPost1.title = "post #1 renamed"
                loadedPost2.title = "post #2 renamed"
                await postRepository.save([loadedPost1, loadedPost2])

                const reloadedPost2 = await postRepository.findOneOrFail({
                    where: { id: post2.id },
                    relations: { categories: true },
                })
                expect(reloadedPost2.categories!.length).to.be.equal(1)
            }),
        ))

    it("remove all elements from many-to-many relation if parent entity is removed", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // save a new category
                const category1 = new Category()
                category1.name = "Animals"
                await dataSource.manager.save(category1)

                // save a new category
                const category2 = new Category()
                category2.name = "Animals"
                await dataSource.manager.save(category2)

                // save a new post
                const newPost = new Post()
                newPost.title = "All about animals"
                await dataSource.manager.save(newPost)

                // now categories to the post inside user and save a user
                newPost.categories = [category1, category2]
                await dataSource.manager.save(newPost)

                // this should not give an error:
                await dataSource.manager.remove(newPost)
            }),
        ))
})
