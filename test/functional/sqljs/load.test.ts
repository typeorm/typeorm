import "reflect-metadata"
import fs from "fs/promises"
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

describe("sqljs driver > load", () => {
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

    it("should load from a file", () =>
        Promise.all(
            connections.map(async (dataSource) => {
                await dataSource.sqljsManager.loadDatabase(
                    "test/functional/sqljs/sqlite/test.sqlite",
                )

                const repository = dataSource.getRepository(Post)
                const post = await repository.findOneBy({ title: "A post" })

                expect(post).not.to.be.null
                if (post) {
                    expect(post.title).to.be.equal("A post")
                }

                const exportedDatabase =
                    dataSource.sqljsManager.exportDatabase()
                expect(exportedDatabase).not.to.be.undefined
                const originalFileContent = await fs.readFile(
                    "test/functional/sqljs/sqlite/test.sqlite",
                )
                expect(exportedDatabase.length).to.equal(
                    originalFileContent.length,
                )
            }),
        ))

    it("should throw an error if the file doesn't exist", () =>
        Promise.all(
            connections.map(async (dataSource) => {
                try {
                    await dataSource.sqljsManager.loadDatabase(
                        "test/functional/sqljs/sqlite/test2.sqlite",
                    )
                    expect(true).to.be.false
                } catch (error) {
                    expect(
                        error.message.match(/File .* does not exist/) !== null,
                    ).to.equal(true, "Should throw: File does not exist")
                }
            }),
        ))
})
