import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Error } from "./entity/Error"

describe("github issues > #1887 Having problems with UNIQUEIDENTIFIERS", () => {
    let connections: DataSource[]
    beforeAll(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    afterAll(() => closeTestingConnections(connections))

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
