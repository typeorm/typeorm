import "reflect-metadata"
import * as path from "path"
import { expect } from "chai"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { PlatformTools } from "../../../../src/platform/PlatformTools"

describe("sqljs driver > startup", () => {
    let dataSources: DataSource[]
    const pathToSqlite = path.resolve(__dirname, "startup.sqlite")

    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["sqljs"],
            driverSpecific: {
                autoSave: true,
                location: pathToSqlite,
            },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should startup even if the file doesn't exist", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // if we come this far, test was successful as a connection was established
                expect(dataSource).to.not.be.null
            }),
        ))

    it("should write a new file after first write operation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.title = "The title"

                const repository = dataSource.getRepository(Post)
                await repository.save(post)

                expect(PlatformTools.fileExist(pathToSqlite)).to.be.true
            }),
        ))
})
