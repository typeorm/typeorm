import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
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

describe("github issues > #1139 mysql primary generated uuid ER_TOO_LONG_KEY", () => {
    let connections: DataSource[]
    after(() => closeTestingConnections(connections))
    it("correctly create primary generated uuid column", async () =>
        (connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        })))
})
