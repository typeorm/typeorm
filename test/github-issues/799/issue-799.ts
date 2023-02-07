import "reflect-metadata"
import * as assert from "assert"
import rimraf from "rimraf"
import { dirname } from "path"
import { DataSource } from "../../../src/data-source/DataSource"
import { getTypeOrmConfig } from "../../utils/test-utils"

describe("github issues > #799 sqlite: 'database' path should be created", () => {
    let dataSource: DataSource

    const path = `${__dirname}/tmp/sqlitedb.db`
    const cleanup = (done: () => void) => {
        rimraf(dirname(path), () => {
            return done()
        })
    }

    before(cleanup)
    after(cleanup)

    afterEach(() => {
        if (dataSource && dataSource.isInitialized) {
            dataSource.close()
        }
    })

    it("should create the whole path to database file", async function () {
        // run test only if better-sqlite3 is enabled in ormconfig
        const isEnabled = getTypeOrmConfig().some(
            (conf) => conf.type === "sqlite" && conf.skip === false,
        )
        if (isEnabled === false) return

        const dataSource = new DataSource({
            name: "sqlite",
            type: "sqlite",
            database: path,
        })
        await dataSource.initialize()

        assert.strictEqual(dataSource.isInitialized, true)
    })

    it("should create the whole path to database file for better-sqlite3", async function () {
        // run test only if better-sqlite3 is enabled in ormconfig
        const isEnabled = getTypeOrmConfig().some(
            (conf) => conf.type === "better-sqlite3" && conf.skip === false,
        )
        if (isEnabled === false) return

        const dataSource = new DataSource({
            name: "better-sqlite3",
            type: "better-sqlite3",
            database: path,
        })
        await dataSource.initialize()

        assert.strictEqual(dataSource.isInitialized, true)
    })
})
