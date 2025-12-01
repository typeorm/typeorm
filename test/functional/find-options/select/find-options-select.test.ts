import "reflect-metadata"
import "../../../utils/test-setup"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { Tag } from "./entity/Tag"

describe("find options > select", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                __dirname,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function prepareData(dataSource: DataSource) {
        const tag = new Tag()
        tag.id = 1
        tag.name = "SuperTag"

        const post = new Post()
        post.id = 1
        post.title = "Hello"
        post.description = "This is a post!"
        post.meta = {
            likes: 10,
            dislikes: 1,
        }
        post.tags = [tag]

        const category = new Category()
        category.id = 1
        category.name = "Action"
        category.description = "Action movies"
        category.posts = [post]

        await dataSource.manager.save(category)
    }

    it("should select all properties of relation post", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const categories = await dataSource.manager.find(Category, {
                    select: {
                        id: true,
                        posts: true,
                    },
                    relations: ["posts"],
                })

                categories.should.be.eql([
                    {
                        id: 1,
                        posts: [
                            {
                                id: 1,
                                title: "Hello",
                                description: "This is a post!",
                                meta: {
                                    likes: 10,
                                    dislikes: 1,
                                },
                            },
                        ],
                    },
                ])
            }),
        ))

    it("should select all properties of relation post and its relation tag", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const categories = await dataSource.manager.find(Category, {
                    select: {
                        id: true,
                        posts: {
                            id: true,
                            title: true,
                            description: true,
                            meta: true,
                            tags: true,
                        },
                    },
                    relations: ["posts", "posts.tags"],
                })

                categories.should.be.eql([
                    {
                        id: 1,
                        posts: [
                            {
                                id: 1,
                                title: "Hello",
                                description: "This is a post!",
                                meta: {
                                    likes: 10,
                                    dislikes: 1,
                                },
                                tags: [
                                    {
                                        id: 1,
                                        name: "SuperTag",
                                    },
                                ],
                            },
                        ],
                    },
                ])
            }),
        ))

    it("should select all from category and meta only from post", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const categories = await dataSource.manager.find(Category, {
                    select: {
                        id: true,
                        posts: {
                            meta: true,
                        },
                    },
                    relations: ["posts"],
                })

                categories.should.be.eql([
                    {
                        id: 1,
                        posts: [
                            {
                                meta: {
                                    likes: 10,
                                    dislikes: 1,
                                },
                            },
                        ],
                    },
                ])
            }),
        ))

    it("should select all from category and meta only from post with all meta properties", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const categories = await dataSource.manager.find(Category, {
                    select: {
                        id: true,
                        posts: {
                            meta: {
                                likes: true,
                            },
                        },
                    },
                    relations: ["posts"],
                })

                categories.should.be.eql([
                    {
                        id: 1,
                        posts: [
                            {
                                meta: {
                                    likes: 10,
                                    dislikes: 1,
                                },
                            },
                        ],
                    },
                ])
            }),
        ))
})
