import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { expect } from "chai"
import { dirname, join } from "path"
import type { DataSource } from "../../../../src"
import type { BetterSqlite3DataSourceOptions } from "../../../../src/driver/better-sqlite3/BetterSqlite3DataSourceOptions"

const betterSqlitePackageJson = require.resolve("better-sqlite3/package.json")
const pathToBetterSqliteNode = join(
    dirname(betterSqlitePackageJson),
    "build/Release/better_sqlite3.node",
)

describe("option nativeBinding for better-sqlite3", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [],
            enabledDrivers: ["better-sqlite3"],
            driverSpecific: {
                nativeBinding: pathToBetterSqliteNode,
            },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should use a the path set in nativeBindings to the node file", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                expect(
                    (
                        dataSource.driver
                            .options as BetterSqlite3DataSourceOptions
                    ).nativeBinding,
                ).to.be.eql(pathToBetterSqliteNode)
            }),
        ))
})
