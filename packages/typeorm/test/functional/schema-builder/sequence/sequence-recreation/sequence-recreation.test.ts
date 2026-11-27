import "reflect-metadata"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../utils/test-utils"

describe("schema builder > sequence > sequence recreation", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should correctly synchronize schema", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.synchronize()
            }),
        ))
})
