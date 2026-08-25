import { expect } from "chai"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { CockroachDriver } from "../../../src/driver/cockroachdb/CockroachDriver"
import { MysqlDriver } from "../../../src/driver/mysql/MysqlDriver"
import { AuroraMysqlDriver } from "../../../src/driver/aurora-mysql/AuroraMysqlDriver"
import type { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"

// Regression test for https://github.com/typeorm/typeorm/issues/12492
//
// normalizeDefault() checked columnMetadata.type === "enum" before checking
// whether the default value was a function, so a function-typed default on
// an enum column was template-literal stringified (calling the function's
// own toString()) instead of being called to produce the actual SQL
// expression.
describe("driver > normalizeDefault > function default on enum column", () => {
    // Minimal columnMetadata stand-in: normalizeDefault() only reads type,
    // isArray and default, so a full ColumnMetadata (which requires a live
    // EntityMetadata/DataSource) isn't needed.
    function makeColumnMetadata(
        overrides: Pick<ColumnMetadata, "type" | "default"> &
            Partial<ColumnMetadata>,
    ): ColumnMetadata {
        return { isArray: false, ...overrides } as unknown as ColumnMetadata
    }

    // MysqlDriver.normalizeDatetimeFunction() reads this.options.type for
    // CURRENT_TIMESTAMP/NOW defaults, so its stub needs a minimal `options`
    // even though the current test cases don't hit that branch.
    const mysqlDriver = Object.create(MysqlDriver.prototype)
    mysqlDriver.options = { type: "mysql" }

    const auroraMysqlDriver = Object.create(AuroraMysqlDriver.prototype)
    auroraMysqlDriver.options = { type: "aurora-mysql" }

    const drivers: [
        string,
        { normalizeDefault(c: ColumnMetadata): string | undefined },
    ][] = [
        ["PostgresDriver", Object.create(PostgresDriver.prototype)],
        ["CockroachDriver", Object.create(CockroachDriver.prototype)],
        ["MysqlDriver", mysqlDriver],
        ["AuroraMysqlDriver", auroraMysqlDriver],
    ]

    for (const [name, driver] of drivers) {
        describe(name, () => {
            it("should call the default function rather than stringify it, for a non-array enum column", () => {
                const columnMetadata = makeColumnMetadata({
                    type: "enum",
                    default: () => "'VALUE2'::enum_def",
                })

                const result = driver.normalizeDefault(columnMetadata)

                expect(result).to.not.include("=>")
                expect(result).to.equal("'VALUE2'::enum_def")
            })

            it("should still stringify a plain (non-function) enum default", () => {
                const columnMetadata = makeColumnMetadata({
                    type: "enum",
                    default: "VALUE1",
                })

                const result = driver.normalizeDefault(columnMetadata)

                expect(result).to.equal("'VALUE1'")
            })
        })
    }
})
