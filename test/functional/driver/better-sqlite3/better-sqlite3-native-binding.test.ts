import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
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
import { join } from "path"
import { DataSource } from "../../../../src"
import { BetterSqlite3ConnectionOptions } from "../../../../src/driver/better-sqlite3/BetterSqlite3ConnectionOptions"

const pathToBetterSqliteNode = join(
    __dirname,
    "../../../../../../node_modules/better-sqlite3/build/Release/better_sqlite3.node",
)

describe("option nativeBinding for better-sqlite3", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [],
                enabledDrivers: ["better-sqlite3"],
                driverSpecific: {
                    nativeBinding: pathToBetterSqliteNode,
                },
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should use a the path set in nativeBindings to the node file", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(
                    (
                        connection.driver
                            .options as BetterSqlite3ConnectionOptions
                    ).nativeBinding,
                ).to.be.eql(pathToBetterSqliteNode)
            }),
        ))
})
