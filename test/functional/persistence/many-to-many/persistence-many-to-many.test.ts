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
import { Game } from "./entity/Game"
import { Genre } from "./entity/Genre"

describe("persistence > many-to-many", function () {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({ __dirname })
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
                const loadedUser = await userRepository.findOne({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser!).not.to.be.null
                expect(loadedUser!.post).not.to.be.undefined
                expect(loadedUser!.post.categories).not.to.be.undefined
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
                const loadedUser1 = await userRepository.findOne({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser1!).not.to.be.null
                expect(loadedUser1!.post).not.to.be.undefined
                expect(loadedUser1!.post.categories).not.to.be.undefined
                expect(loadedUser1!.post.categories!.length).to.be.equal(2)

                // now remove added categories
                newPost.categories = [category1]
                newUser.post = newPost
                await userRepository.save(newUser)

                // load a post
                const loadedUser2 = await userRepository.findOne({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser2!).not.to.be.null
                expect(loadedUser2!.post).not.to.be.undefined
                expect(loadedUser2!.post.categories).not.to.be.undefined
                expect(loadedUser2!.post.categories!.length).to.be.equal(1)
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
                const loadedUser1 = await userRepository.findOne({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser1!).not.to.be.null
                expect(loadedUser1!.post).not.to.be.undefined
                expect(loadedUser1!.post.categories).not.to.be.undefined
                expect(loadedUser1!.post.categories!.length).to.be.equal(2)

                // now remove added categories
                newPost.categories = []
                newUser.post = newPost
                await userRepository.save(newUser)

                // load a post
                const loadedUser2 = await userRepository.findOne({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser2!).not.to.be.null
                expect(loadedUser2!.post).not.to.be.undefined
                expect(loadedUser2!.post.categories!.length).to.be.equal(0)
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
                const loadedUser1 = await userRepository.findOne({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser1!).not.to.be.null
                expect(loadedUser1!.post).not.to.be.undefined
                expect(loadedUser1!.post.categories).not.to.be.undefined
                expect(loadedUser1!.post.categories!.length).to.be.equal(2)

                // now remove added categories
                newPost.categories = null
                newUser.post = newPost
                await userRepository.save(newUser)

                // load a post
                const loadedUser2 = await userRepository.findOne({
                    where: {
                        id: newUser.id,
                    },
                    relations: {
                        post: {
                            categories: true,
                        },
                    },
                })

                expect(loadedUser2!).not.to.be.null
                expect(loadedUser2!.post).not.to.be.undefined
                expect(loadedUser2!.post.categories!.length).to.be.equal(0)
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
    it("should persist many-to-many without throwing duplicate key error when entity has multiple primary keys", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const gameRepository = connection.getRepository(Game)

                const genre1 = new Genre()
                genre1.id = 1
                genre1.name = "Action"

                const genre2 = new Genre()
                genre2.id = 2
                genre2.name = "Adventure"

                const game = new Game()
                game.id = 1
                game.name = "Game 1"
                game.genres = [genre1, genre2]

                await gameRepository.save(game)

                const genre3 = new Genre()
                genre3.id = 1
                genre3.name = "Action" // Same entity as genre1

                const game2 = new Game()
                game2.id = 2
                game2.name = "Game 2"
                game2.genres = [genre3]

                // typeorm will fetch existing genre1 from the database and link it
                // to game2 instead of trying to insert new genre
                // will not throw duplicate key error
                await expect(gameRepository.save(game2)).not.to.be.rejected
            }),
        ))
})
