import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"

describe("github issues > #1139 mysql primary generated uuid ER_TOO_LONG_KEY", () => {
    let connections: DataSource[]
    afterAll(() => closeTestingConnections(connections))
    it("correctly create primary generated uuid column", async () =>
        (connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        })))
})
