import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Error } from "./entity/Error"
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

describe("github issues > #1887 Having problems with UNIQUEIDENTIFIERS", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(connections))

    it("should correctly insert data", () =>
        Promise.all(
            connections.map(async (connection) => {
                const errorRepository = connection.getRepository(Error)
                const err = new Error()
                err.errorDate = new Date()
                err.errorDescription = "test insert error"
                err.errorNumber = 505
                err.executionGuid = "82E66316-AC4C-4EE2-8F98-66694FA38261"
                await errorRepository.insert(err)
            }),
        ))
})
