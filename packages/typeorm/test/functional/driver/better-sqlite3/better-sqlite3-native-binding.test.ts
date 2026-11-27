import { expect } from "chai"
import path from "node:path"
import "reflect-metadata"
import type { DataSource } from "../../../../src"
import type { BetterSqlite3DataSourceOptions } from "../../../../src/driver/better-sqlite3/BetterSqlite3DataSourceOptions"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

const pathToBetterSqliteNode = path.resolve(
    require.resolve("better-sqlite3"),
    `../../prebuilds/${process.platform}-${process.arch}.node`,
)

describe("option nativeBinding for better-sqlite3", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [],
            enabledDrivers: ["better-sqlite3"],
            driverSpecific: {
                nativeBinding: pathToBetterSqliteNode,
            },
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

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
