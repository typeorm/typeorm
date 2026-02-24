import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { expect } from "chai"
import { join } from "path"
import type { DataSource } from "../../../../src"
import type { BetterSqlite3DataSourceOptions } from "../../../../src/driver/better-sqlite3/BetterSqlite3DataSourceOptions"

const pathToBetterSqliteNode = join(
    __dirname,
    "../../../../../../node_modules/better-sqlite3/build/Release/better_sqlite3.node",
)

describe("option nativeBinding for better-sqlite3", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [],
                enabledDrivers: ["better-sqlite3"],
                driverSpecific: {
                    nativeBinding: pathToBetterSqliteNode,
                },
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should use a the path set in nativeBindings to the node file", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                expect(
                    (
                        connection.driver
                            .options as BetterSqlite3DataSourceOptions
                    ).nativeBinding,
                ).to.be.eql(pathToBetterSqliteNode)
            }),
        ))
})
