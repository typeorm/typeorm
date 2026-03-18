import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #1751 Create sequence repeatedly when it already exists", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    afterAll(() => closeTestingConnections(dataSources))

    it("should correctly synchronize schema", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.synchronize()
            }),
        ))
})
