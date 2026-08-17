import { expect } from "chai"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { CockroachDriver } from "../../../src/driver/cockroachdb/CockroachDriver"
import { MysqlDriver } from "../../../src/driver/mysql/MysqlDriver"
import type { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"

// Regression test for https://github.com/typeorm/typeorm/issues/12492
//
// normalizeDefault() checked columnMetadata.type === "enum" before checking
// whether the default value was a function, so a function-typed default on
// an enum column was template-literal stringified (calling the function's
// own toString()) instead of being called to produce the actual SQL
// expression.
describe("driver > normalizeDefault > function default on enum column", () => {
    // Create minimal driver instances using Object.create to avoid
    // constructor side effects — normalizeDefault() is a pure function of
    // columnMetadata, no live connection needed.
    const drivers: [
        string,
        { normalizeDefault(c: ColumnMetadata): string | undefined },
    ][] = [
        ["PostgresDriver", Object.create(PostgresDriver.prototype)],
        ["CockroachDriver", Object.create(CockroachDriver.prototype)],
        ["MysqlDriver", Object.create(MysqlDriver.prototype)],
    ]

    for (const [name, driver] of drivers) {
        describe(name, () => {
            it("should call the default function rather than stringify it, for a non-array enum column", () => {
                const columnMetadata = {
                    type: "enum",
                    isArray: false,
                    default: () => "'VALUE2'::enum_def",
                } as unknown as ColumnMetadata

                const result = driver.normalizeDefault(columnMetadata)

                expect(result).to.not.include("=>")
                expect(result).to.equal("'VALUE2'::enum_def")
            })

            it("should still stringify a plain (non-function) enum default", () => {
                const columnMetadata = {
                    type: "enum",
                    isArray: false,
                    default: "VALUE1",
                } as unknown as ColumnMetadata

                const result = driver.normalizeDefault(columnMetadata)

                expect(result).to.equal("'VALUE1'")
            })
        })
    }
})
