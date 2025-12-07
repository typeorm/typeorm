import "reflect-metadata"
import fs from "fs/promises"
import path from "path"
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
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("sqljs driver > save", () => {
    const pathToSqlite = path.resolve(__dirname, "export.sqlite")
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["sqljs"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should save to file", () =>
        Promise.all(
            connections.map(async (dataSource) => {
                try {
                    await fs.unlink(pathToSqlite)
                } catch {}

                const post = new Post()
                post.title = "The second title"

                const repository = dataSource.getRepository(Post)
                await repository.save(post)

                await dataSource.sqljsManager.saveDatabase(pathToSqlite)
                await expect(fs.access(pathToSqlite, fs.constants.F_OK)).not.to
                    .be.rejected
            }),
        ))

    it("should load a file that was saved", () =>
        Promise.all(
            connections.map(async (dataSource) => {
                await dataSource.sqljsManager.loadDatabase(pathToSqlite)

                const repository = dataSource.getRepository(Post)
                const post = await repository.findOneBy({
                    title: "The second title",
                })

                expect(post).not.to.be.null
                if (post) {
                    expect(post.title).to.be.equal("The second title")
                }
            }),
        ))
})
