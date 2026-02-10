import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../../../src/data-source/DataSource"
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
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    async function prepareData(connection: DataSource) {
        const profile = new Profile()
        profile.about = "I cut trees!"
        await connection.manager.save(profile)

        const user = new User()
        user.firstName = "Timber"
        user.lastName = "Saw"
        user.profile = profile
        await connection.manager.save(user)

        const primaryCategory1 = new Category()
        primaryCategory1.name = "primary category #1"
        await connection.manager.save(primaryCategory1)

        const primaryCategory2 = new Category()
        primaryCategory2.name = "primary category #2"
        await connection.manager.save(primaryCategory2)

        const secondaryCategory1 = new Category()
        secondaryCategory1.name = "secondary category #1"
        await connection.manager.save(secondaryCategory1)

        const secondaryCategory2 = new Category()
        secondaryCategory2.name = "secondary category #2"
        await connection.manager.save(secondaryCategory2)

        const post = new Post()
        post.title = "about eager relations"
        post.categories1 = [primaryCategory1, primaryCategory2]
        post.categories2 = [secondaryCategory1, secondaryCategory2]
        post.author = user
        await connection.manager.save(post)

        const editor = new Editor()
        editor.post = post
        editor.user = user
        await connection.manager.save(editor)
    }

    it("should load all eager relations when object is loaded", () =>
        Promise.all(
            connections.map(async (connection) => {
                await prepareData(connection)

                const loadedPost = await connection.manager.findOne(Post, {
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
            connections.map(async (connection) => {
                await prepareData(connection)

                const loadedPost = await connection.manager
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
            connections.map(async (connection) => {
                await prepareData(connection)

                // Prepare test data - reusing existing entities
                const nestedProfile = new Profile()
                nestedProfile.about = "I am nested!"
                await connection.manager.save(nestedProfile)

                const user = (await connection.manager.findOne(User, {
                    where: { id: 1 },
                }))!
                user.nestedProfile = nestedProfile
                await connection.manager.save(user)

                // Retrieve user with manually specified nested relation
                const retrievedEditor = await connection.manager.findOne(
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

    it("should not duplicate joins when eager relation with DeleteDateColumn is also manually requested", () =>
        Promise.all(
            connections.map(async (connection) => {
                await prepareData(connection)

                const nestedProfile = new Profile()
                nestedProfile.about = "I am nested!"
                await connection.manager.save(nestedProfile)

                const user = (await connection.manager.findOne(User, {
                    where: { id: 1 },
                }))!
                user.nestedProfile = nestedProfile
                await connection.manager.save(user)

                const editorRepo = connection.getRepository(Editor)
                const qb = editorRepo
                    .createQueryBuilder("Editor")
                    .setFindOptions({
                        where: { userId: 1 },
                        relations: {
                            user: {
                                nestedProfile: true,
                            },
                        },
                    })

                const sql = qb.getSql()

                // The user table should be joined exactly once
                const userJoinMatches = sql.match(
                    /JOIN\s+"user"/gi,
                )
                expect(userJoinMatches).to.not.be.null
                expect(userJoinMatches!.length).to.equal(
                    1,
                    "User table should be joined exactly once, but was joined " +
                        userJoinMatches!.length +
                        " times. SQL: " +
                        sql,
                )

                // The profile table should also not be duplicated
                const profileJoinMatches = sql.match(
                    /JOIN\s+"profile"/gi,
                )
                expect(profileJoinMatches).to.not.be.null
                // profile is joined twice: once for eager profile, once for nestedProfile
                expect(profileJoinMatches!.length).to.equal(
                    2,
                    "Profile table should be joined exactly twice (for profile and nestedProfile), but was joined " +
                        profileJoinMatches!.length +
                        " times. SQL: " +
                        sql,
                )
            }),
        ))

    it("should not duplicate joins when using find with relations option on entity with DeleteDateColumn", () =>
        Promise.all(
            connections.map(async (connection) => {
                await prepareData(connection)

                const nestedProfile = new Profile()
                nestedProfile.about = "I am nested!"
                await connection.manager.save(nestedProfile)

                const user = (await connection.manager.findOne(User, {
                    where: { id: 1 },
                }))!
                user.nestedProfile = nestedProfile
                await connection.manager.save(user)

                // Use the repository's find method which exercises FindOptionsUtils
                const editors = await connection.manager.find(Editor, {
                    where: { userId: 1 },
                    relations: {
                        user: {
                            nestedProfile: true,
                        },
                    },
                })

                expect(editors).to.have.length(1)
                const editor = editors[0]

                // All eager and manually specified relations should be loaded
                expect(editor.user).to.not.be.undefined
                expect(editor.user.firstName).to.equal("Timber")

                // Eager profile relation should be loaded
                expect(editor.user.profile).to.not.be.undefined
                expect(editor.user.profile.about).to.equal("I cut trees!")

                // Manually requested nestedProfile should also be loaded
                expect(editor.user.nestedProfile).to.not.be.undefined
                expect(editor.user.nestedProfile.about).to.equal(
                    "I am nested!",
                )
            }),
        ))
})
