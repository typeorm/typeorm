import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Roles } from "./entity/Roles"

describe("github issues > #3536 Sync only works once for enums on entities with capital letters in entity name", () => {
    let connections: DataSource[]
    beforeAll(async () => {
        connections = await createTestingConnections({
            entities: [Roles],
            enabledDrivers: ["postgres"],
            dropSchema: true,
        })
    })
    afterAll(() => closeTestingConnections(connections))

    it("should run without throw error", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.synchronize()
                await connection.synchronize()
            }),
        ))
})
