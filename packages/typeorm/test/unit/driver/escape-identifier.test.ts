import { expect } from "chai"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { CockroachDriver } from "../../../src/driver/cockroachdb/CockroachDriver"
import { MysqlDriver } from "../../../src/driver/mysql/MysqlDriver"
import { SqlServerDriver } from "../../../src/driver/sqlserver/SqlServerDriver"
import { SapDriver } from "../../../src/driver/sap/SapDriver"
import { OracleDriver } from "../../../src/driver/oracle/OracleDriver"
import { AbstractSqliteDriver } from "../../../src/driver/sqlite-abstract/AbstractSqliteDriver"
import { SpannerDriver } from "../../../src/driver/spanner/SpannerDriver"

describe("driver > escape", () => {
    // Create minimal driver instances using Object.create to avoid
    // constructor side effects — we only need the escape() method.
    const doubleQuoteDrivers: [string, { escape(name: string): string }][] = [
        ["PostgresDriver", Object.create(PostgresDriver.prototype)],
        ["CockroachDriver", Object.create(CockroachDriver.prototype)],
        ["SqlServerDriver", Object.create(SqlServerDriver.prototype)],
        ["SapDriver", Object.create(SapDriver.prototype)],
        ["OracleDriver", Object.create(OracleDriver.prototype)],
        ["AbstractSqliteDriver", Object.create(AbstractSqliteDriver.prototype)],
    ]

    const backtickDrivers: [string, { escape(name: string): string }][] = [
        ["MysqlDriver", Object.create(MysqlDriver.prototype)],
        ["SpannerDriver", Object.create(SpannerDriver.prototype)],
    ]

    describe("double-quote drivers", () => {
        for (const [name, driver] of doubleQuoteDrivers) {
            describe(name, () => {
                it("should wrap identifier in double quotes", () => {
                    expect(driver.escape("column")).to.equal('"column"')
                })

                it("should escape internal double quotes", () => {
                    expect(driver.escape('my"col')).to.equal('"my""col"')
                })

                it("should handle multiple internal double quotes", () => {
                    expect(driver.escape('a"b"c')).to.equal('"a""b""c"')
                })

                it("should handle identifier that is only a double quote", () => {
                    expect(driver.escape('"')).to.equal('""""')
                })

                it("should not alter identifiers without special characters", () => {
                    expect(driver.escape("simple_name")).to.equal(
                        '"simple_name"',
                    )
                })
            })
        }
    })

    describe("backtick drivers", () => {
        for (const [name, driver] of backtickDrivers) {
            describe(name, () => {
                it("should wrap identifier in backticks", () => {
                    expect(driver.escape("column")).to.equal("`column`")
                })

                it("should escape internal backticks", () => {
                    expect(driver.escape("my`col")).to.equal("`my``col`")
                })

                it("should handle multiple internal backticks", () => {
                    expect(driver.escape("a`b`c")).to.equal("`a``b``c`")
                })

                it("should handle identifier that is only a backtick", () => {
                    expect(driver.escape("`")).to.equal("````")
                })

                it("should not alter identifiers without special characters", () => {
                    expect(driver.escape("simple_name")).to.equal(
                        "`simple_name`",
                    )
                })
            })
        }
    })
})
