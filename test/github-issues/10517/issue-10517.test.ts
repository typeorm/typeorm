import "reflect-metadata"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #10517 EntityManager update/delete/softDelete don't work with list of where condition objects", function () {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("update by array of condition objects", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // save a new posts
                const newPost1 = postRepository.create()
                newPost1.title = "Super post #1"
                const newPost2 = postRepository.create()
                newPost2.title = "Super post #2"
                const newPost3 = postRepository.create()
                newPost3.title = "Super post #3"
                const newPost4 = postRepository.create()
                newPost4.title = "Super post #4"

                await postRepository.save(newPost1)
                await postRepository.save(newPost2)
                await postRepository.save(newPost3)
                await postRepository.save(newPost4)

                // update many
                await postRepository.update(
                    [
                        {
                            title: "Super post #1",
                        },
                        {
                            title: "Super post #2",
                        },
                    ],
                    { title: "Super post" },
                )

                // load to check
                const loadedPost1 = await postRepository.findOne({
                    where: {
                        id: 1,
                    },
                })
                const loadedPost2 = await postRepository.findOne({
                    where: {
                        id: 2,
                    },
                })

                // assert
                expect(loadedPost1).to.be.eql({
                    id: 1,
                    title: "Super post",
                    deletedDate: null,
                })

                expect(loadedPost2).to.be.eql({
                    id: 2,
                    title: "Super post",
                    deletedDate: null,
                })
            }),
        ))

    it("delete by array of condition objects", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // save a new posts
                const newPost1 = postRepository.create()
                newPost1.title = "Super post #1"
                const newPost2 = postRepository.create()
                newPost2.title = "Super post #2"
                const newPost3 = postRepository.create()
                newPost3.title = "Super post #3"
                const newPost4 = postRepository.create()
                newPost4.title = "Super post #4"

                await postRepository.save(newPost1)
                await postRepository.save(newPost2)
                await postRepository.save(newPost3)
                await postRepository.save(newPost4)

                // delete many
                await postRepository.delete([
                    {
                        title: "Super post #1",
                    },
                    {
                        title: "Super post #2",
                    },
                ])

                // load to check
                const loadedPost1 = await postRepository.findOne({
                    where: {
                        id: 1,
                    },
                })
                const loadedPost2 = await postRepository.findOne({
                    where: {
                        id: 2,
                    },
                })

                // assert
                expect(loadedPost1).to.be.eql(null)

                expect(loadedPost2).to.be.eql(null)
            }),
        ))

    it("soft delete by array of condition objects", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // save a new posts
                const newPost1 = postRepository.create()
                newPost1.title = "Super post #1"
                const newPost2 = postRepository.create()
                newPost2.title = "Super post #2"
                const newPost3 = postRepository.create()
                newPost3.title = "Super post #3"
                const newPost4 = postRepository.create()
                newPost4.title = "Super post #4"

                await postRepository.save(newPost1)
                await postRepository.save(newPost2)
                await postRepository.save(newPost3)
                await postRepository.save(newPost4)

                // delete many
                await postRepository.softDelete([
                    {
                        title: "Super post #1",
                    },
                    {
                        title: "Super post #2",
                    },
                ])

                // load to check
                const loadedPost1 = await postRepository.findOne({
                    where: {
                        id: 1,
                    },
                })
                const loadedPost2 = await postRepository.findOne({
                    where: {
                        id: 2,
                    },
                })

                // assert
                expect(loadedPost1).to.be.eql(null)

                expect(loadedPost2).to.be.eql(null)
            }),
        ))

    it("restore by array of condition objects", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // save a new posts
                const newPost1 = postRepository.create()
                newPost1.title = "Super post #1"
                const newPost2 = postRepository.create()
                newPost2.title = "Super post #2"
                const newPost3 = postRepository.create()
                newPost3.title = "Super post #3"
                const newPost4 = postRepository.create()
                newPost4.title = "Super post #4"

                await postRepository.save(newPost1)
                await postRepository.save(newPost2)
                await postRepository.save(newPost3)
                await postRepository.save(newPost4)

                const conditions = [
                    {
                        title: "Super post #1",
                    },
                    {
                        title: "Super post #2",
                    },
                ]

                // update many
                await postRepository.softDelete(conditions)

                await postRepository.restore(conditions)

                // load to check
                const loadedPost1 = await postRepository.findOne({
                    where: {
                        id: 1,
                    },
                })
                const loadedPost2 = await postRepository.findOne({
                    where: {
                        id: 2,
                    },
                })

                // assert
                expect(loadedPost1).to.be.eql({
                    id: 1,
                    title: "Super post #1",
                    deletedDate: null,
                })

                expect(loadedPost2).to.be.eql({
                    id: 2,
                    title: "Super post #2",
                    deletedDate: null,
                })
            }),
        ))
})
