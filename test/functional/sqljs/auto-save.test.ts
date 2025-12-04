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
import { Post } from "./entity/Post"
import { DataSource } from "../../../src/data-source/DataSource"
import { createTestingConnections } from "../../utils/test-utils"

describe("sqljs driver > autosave", () => {
    let connections: DataSource[]
    let saves = 0
    const callback = () => {
        saves++
    }

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post],
                schemaCreate: true,
                enabledDrivers: ["sqljs"],
                driverSpecific: {
                    autoSaveCallback: callback,
                    autoSave: true,
                },
            })),
    )

    it("should call autoSaveCallback on insert, update and delete", () =>
        Promise.all(
            connections.map(async (connection) => {
                const posts = [
                    {
                        title: "second post",
                    },
                    {
                        title: "third post",
                    },
                ]

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(posts)
                    .execute()
                await connection
                    .createQueryBuilder()
                    .update(Post)
                    .set({ title: "Many posts" })
                    .execute()
                await connection
                    .createQueryBuilder()
                    .delete()
                    .from(Post)
                    .where("title = ?", { title: "third post" })
                    .execute()

                const repository = connection.getRepository(Post)
                const post = new Post()
                post.title = "A post"
                await repository.save(post)

                const savedPost = await repository.findOneBy({
                    title: "A post",
                })

                expect(savedPost).not.to.be.null

                if (savedPost) {
                    savedPost.title = "A updated post"
                    await repository.save(savedPost)
                    await repository.remove(savedPost)
                }

                await connection.close()

                expect(saves).to.be.equal(8)
            }),
        ))
})

describe("sqljs driver > autosave off", () => {
    let connections: DataSource[]
    let saves = 0
    const callback = () => {
        saves++
    }

    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post],
                schemaCreate: true,
                enabledDrivers: ["sqljs"],
                driverSpecific: {
                    autoSaveCallback: callback,
                    autoSave: false,
                },
            })),
    )

    it("should not call autoSaveCallback when autoSave is disabled", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repository = connection.getRepository(Post)
                const post = new Post()
                post.title = "A post"
                await repository.save(post)

                const savedPost = await repository.findOneBy({
                    title: "A post",
                })

                expect(savedPost).not.to.be.null

                if (savedPost) {
                    savedPost.title = "A updated post"
                    await repository.save(savedPost)
                    await repository.remove(savedPost)
                }

                await connection.close()

                expect(saves).to.be.equal(0)
            }),
        ))
})
