import "reflect-metadata"
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
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("sqlite driver > throws an error when queried after closing connection", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [],
                enabledDrivers: ["sqlite"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should throw", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.close()
                await expect(
                    connection.query("select * from sqlite_master;"),
                ).to.rejectedWith(
                    "Connection with sqlite database is not established. Check connection configuration.",
                )
            }),
        ))
})
