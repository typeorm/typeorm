import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

// Standard SQLite C API open flag constants (from sqlite3.h)
const SQLITE_OPEN_READWRITE = 0x00000002
const SQLITE_OPEN_CREATE = 0x00000004
const SQLITE_OPEN_URI = 0x00000040
const SQLITE_OPEN_SHAREDCACHE = 0x00020000

describe("sqlite driver > file open flags", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                name: "file:./temp/sqlitedb-memory.db?mode=memory",
                entities: [],
                enabledDrivers: ["better-sqlite3"],
                driverSpecific: {
                    flags:
                        SQLITE_OPEN_URI |
                        SQLITE_OPEN_SHAREDCACHE |
                        SQLITE_OPEN_READWRITE |
                        SQLITE_OPEN_CREATE,
                },
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should open a DB with flags as expected", () =>
        Promise.all(
            connections.map(async (connection) => {
                // if we come this far, test was successful as a connection was established
                const result = await connection.query("PRAGMA journal_mode")

                expect(result).to.eql([{ journal_mode: "wal" }])
            }),
        ))
})
