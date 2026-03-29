import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Category } from "./entity/Category"
import { Editor } from "./entity/Editor"
import { Post } from "./entity/Post"
import { Profile } from "./entity/Profile"
import { User } from "./entity/User"

describe("relations > eager relations > basic", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function prepareData(dataSource: DataSource) {
        const profile = new Profile()
        profile.about = "I cut trees!"
        await dataSource.manager.save(profile)

        const user = new User()
        user.firstName = "Timber"
        user.lastName = "Saw"
        user.profile = profile
        await dataSource.manager.save(user)

        const primaryCategory1 = new Category()
        primaryCategory1.name = "primary category #1"
        await dataSource.manager.save(primaryCategory1)

        const primaryCategory2 = new Category()
        primaryCategory2.name = "primary category #2"
        await dataSource.manager.save(primaryCategory2)

        const secondaryCategory1 = new Category()
        secondaryCategory1.name = "secondary category #1"
        await dataSource.manager.save(secondaryCategory1)

        const secondaryCategory2 = new Category()
        secondaryCategory2.name = "secondary category #2"
        await dataSource.manager.save(secondaryCategory2)

        const post = new Post()
        post.title = "about eager relations"
        post.categories1 = [primaryCategory1, primaryCategory2]
        post.categories2 = [secondaryCategory1, secondaryCategory2]
        post.author = user
        await dataSource.manager.save(post)

        const editor = new Editor()
        editor.post = post
        editor.user = user
        await dataSource.manager.save(editor)
    }

    it("should load all eager relations when object is loaded", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const loadedPost = await dataSource.manager.findOne(Post, {
                    where: {
                        id: 1,
                    },
                })

                // sort arrays because some drivers returns arrays in wrong order, e.g. categoryIds: [2, 1]
                loadedPost!.categories1.sort((a, b) => a.id - b.id)
                loadedPost!.categories2.sort((a, b) => a.id - b.id)

                expect(loadedPost).to.deep.equal({
                    id: 1,
                    title: "about eager relations",
                    categories1: [
                        {
                            id: 1,
                            name: "primary category #1",
                        },
                        {
                            id: 2,
                            name: "primary category #2",
                        },
                    ],
                    categories2: [
                        {
                            id: 3,
                            name: "secondary category #1",
                        },
                        {
                            id: 4,
                            name: "secondary category #2",
                        },
                    ],
                    author: {
                        id: 1,
                        firstName: "Timber",
                        lastName: "Saw",
                        deletedAt: null,
                        profile: {
                            id: 1,
                            about: "I cut trees!",
                        },
                    },
                    editors: [
                        {
                            userId: 1,
                            postId: 1,
                            user: {
                                id: 1,
                                firstName: "Timber",
                                lastName: "Saw",
                                deletedAt: null,
                                profile: {
                                    id: 1,
                                    about: "I cut trees!",
                                },
                            },
                        },
                    ],
                })
            }),
        ))

    it("should not load eager relations when query builder is used", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const loadedPost = await dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .where("post.id = :id", { id: 1 })
                    .getOne()

                expect(loadedPost).to.deep.equal({
                    id: 1,
                    title: "about eager relations",
                })
            }),
        ))

    it("should preserve manually requested nested relations with DeleteDateColumn", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                // Prepare test data - reusing existing entities
                const nestedProfile = new Profile()
                nestedProfile.about = "I am nested!"
                await dataSource.manager.save(nestedProfile)

                const user = (await dataSource.manager.findOne(User, {
                    where: { id: 1 },
                }))!
                user.nestedProfile = nestedProfile
                await dataSource.manager.save(user)

                // Retrieve user with manually specified nested relation
                const retrievedEditor = await dataSource.manager.findOne(
                    Editor,
                    {
                        where: { userId: 1 },
                        relations: {
                            user: {
                                nestedProfile: true,
                            },
                        },
                    },
                )

                // Assertions
                expect(retrievedEditor).to.deep.equal({
                    userId: 1,
                    postId: 1,
                    user: {
                        id: 1,
                        firstName: "Timber",
                        lastName: "Saw",
                        deletedAt: null,
                        nestedProfile: {
                            id: 2,
                            about: "I am nested!",
                        },
                        profile: {
                            id: 1,
                            about: "I cut trees!",
                        },
                    },
                })
            }),
        ))

    it("should not join eager relations twice when explicitly specified with DeleteDateColumn entity (issue #11823)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const nestedProfile = new Profile()
                nestedProfile.about = "I am nested!"
                await dataSource.manager.save(nestedProfile)

                const user = (await dataSource.manager.findOne(User, {
                    where: { id: 1 },
                }))!
                user.nestedProfile = nestedProfile
                await dataSource.manager.save(user)

                // Build the query to inspect the generated SQL
                const sql = dataSource.manager
                    .getRepository(Editor)
                    .metadata.dataSource.createQueryBuilder(Editor, "Editor")
                    .setFindOptions({
                        where: { userId: 1 },
                        relations: {
                            user: {
                                nestedProfile: true,
                            },
                        },
                    })
                    .getQuery()

                // The user table should only be joined once, not twice
                // Previously, eager relations with DeleteDateColumn would
                // cause the user table to be joined twice with different aliases
                const userJoinCount = (
                    sql.match(/LEFT JOIN \(?."?user"?/gi) || []
                ).length
                expect(userJoinCount).to.equal(1)
            }),
        ))
})
