import "reflect-metadata"
import * as assert from "assert"
import { createConnection, getConnectionOptions } from "../../../src/index"
import { DataSource } from "../../../src/data-source/DataSource"
import { getTypeOrmConfig } from "../../utils/test-utils"

describe("github issues > #798 sqlite: 'database' path in ormconfig.json is not relative", () => {
    let connection: DataSource
    const oldCwd = process.cwd()

    before(function () {
        process.chdir("..")
    })

    after(function () {
        process.chdir(oldCwd)
    })

    afterEach(() => {
        if (connection && connection.isInitialized) {
            connection.close()
        }
    })

    it("should find the sqlite database if the cwd is changed", async function () {
        // run test only if sqlite3 is enabled in ormconfig
        const isEnabled = getTypeOrmConfig().some(
            (conf) => conf.type === "sqlite" && conf.skip === false,
        )
        if (!isEnabled) return

        const options = await getConnectionOptions("sqlite")
        connection = await createConnection(options)

        assert.strictEqual(connection.isInitialized, true)
    })

    it("should find the sqlite database if the cwd is changed for better-sqlite3", async function () {
        // run test only if sqlite3 is enabled in ormconfig
        const isEnabled = getTypeOrmConfig().some(
            (conf) => conf.type === "better-sqlite3" && conf.skip === false,
        )
        if (!isEnabled) return

        const options = await getConnectionOptions("better-sqlite3")
        connection = await createConnection(options)

        assert.strictEqual(connection.isInitialized, true)
    })
})
