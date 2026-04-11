import "reflect-metadata"
import type { DataSource } from "../../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../../utils/test-utils"
import { Roles } from "./entity/Roles"

describe("schema builder > column type > enum > enum capital letters", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Roles],
            enabledDrivers: ["postgres"],
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should run without throw error", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.synchronize()
                await connection.synchronize()
            }),
        ))
})
