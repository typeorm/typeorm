import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { expect } from "chai"
import { existsSync } from "fs"
import { dirname, join } from "path"
import type { DataSource } from "../../../../src"
import type { ObjectLiteral } from "../../../../src/common/ObjectLiteral"
import type { BetterSqlite3DataSourceOptions } from "../../../../src/driver/better-sqlite3/BetterSqlite3DataSourceOptions"
import { PlatformTools } from "../../../../src/platform/PlatformTools"

// better-sqlite3 v12 builds the addon into build/Release, v13 ships prebuilds
const betterSqlite3Directory = dirname(
    require.resolve("better-sqlite3/package.json"),
)
const releaseBuildPath = join(
    betterSqlite3Directory,
    "build",
    "Release",
    "better_sqlite3.node",
)
const pathToBetterSqliteNode = existsSync(releaseBuildPath)
    ? releaseBuildPath
    : join(
          betterSqlite3Directory,
          "prebuilds",
          `${process.platform}-${process.arch}.node`,
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

describe("better-sqlite3 driver > nativeBinding forwarding", () => {
    let receivedOptions: ObjectLiteral[] = []

    // better-sqlite3 v13 platform entrypoints (e.g. "better-sqlite3/linux-x64")
    // throw when the nativeBinding option is present, even as null (#12961)
    function RecordingDatabase(filename: string, options: ObjectLiteral) {
        receivedOptions.push(options)
        const BetterSqlite3 = PlatformTools.load("better-sqlite3")
        return new BetterSqlite3(filename, options)
    }

    describe("when nativeBinding is not set", () => {
        let dataSources: DataSource[]
        before(async function () {
            receivedOptions = []
            dataSources = await createTestingConnections({
                entities: [],
                enabledDrivers: ["better-sqlite3"],
                driverSpecific: {
                    driver: RecordingDatabase,
                },
            })
            if (!dataSources.length) this.skip()
        })
        after(() => closeTestingConnections(dataSources))

        it("should not pass the option to better-sqlite3", () => {
            expect(receivedOptions).to.have.lengthOf(dataSources.length)
            for (const options of receivedOptions)
                expect(options).not.to.have.property("nativeBinding")
        })
    })

    describe("when nativeBinding is set", () => {
        let dataSources: DataSource[]
        before(async function () {
            receivedOptions = []
            dataSources = await createTestingConnections({
                entities: [],
                enabledDrivers: ["better-sqlite3"],
                driverSpecific: {
                    driver: RecordingDatabase,
                    nativeBinding: pathToBetterSqliteNode,
                },
            })
            if (!dataSources.length) this.skip()
        })
        after(() => closeTestingConnections(dataSources))

        it("should pass the option to better-sqlite3", () => {
            expect(receivedOptions).to.have.lengthOf(dataSources.length)
            for (const options of receivedOptions)
                expect(options).to.have.property(
                    "nativeBinding",
                    pathToBetterSqliteNode,
                )
        })
    })
})
