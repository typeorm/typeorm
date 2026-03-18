import "reflect-metadata"
import { expect } from "chai"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { createTestingConnections } from "../../../utils/test-utils"

describe("sqljs driver > autosave", () => {
    let dataSources: DataSource[]
    let saves = 0
    const callback = () => {
        saves++
    }

    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            enabledDrivers: ["sqljs"],
            driverSpecific: {
                autoSaveCallback: callback,
                autoSave: true,
            },
        })
    })

    it("should call autoSaveCallback on insert, update and delete", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const posts = [
                    {
                        title: "second post",
                    },
                    {
                        title: "third post",
                    },
                ]

                await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(posts)
                    .execute()
                await dataSource
                    .createQueryBuilder()
                    .update(Post)
                    .set({ title: "Many posts" })
                    .execute()
                await dataSource
                    .createQueryBuilder()
                    .delete()
                    .from(Post)
                    .where("title = ?", { title: "third post" })
                    .execute()

                const repository = dataSource.getRepository(Post)
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

                await dataSource.destroy()

                expect(saves).to.be.equal(8)
            }),
        ))
})

describe("sqljs driver > autosave off", () => {
    let dataSources: DataSource[]
    let saves = 0
    const callback = () => {
        saves++
    }

    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            enabledDrivers: ["sqljs"],
            driverSpecific: {
                autoSaveCallback: callback,
                autoSave: false,
            },
        })
    })

    it("should not call autoSaveCallback when autoSave is disabled", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Post)
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

                await dataSource.destroy()

                expect(saves).to.be.equal(0)
            }),
        ))
})
