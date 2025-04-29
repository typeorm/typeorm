import { expect } from "chai"
import { SqlTagUtils } from "../../src/util/SqlTagUtils"
import { DatabaseType } from "../../src/driver/types/DatabaseType"

describe("SqlTagUtils", () => {
    describe("getParameterStrategy", () => {
        it("should return 'dollar' for PostgreSQL and related databases", () => {
            const postgresTypes: DatabaseType[] = [
                "postgres",
                "cockroachdb",
                "aurora-postgres",
                "mariadb",
            ]

            for (const type of postgresTypes) {
                expect(SqlTagUtils.getParameterStrategy(type)).to.equal("dollar")
            }
        })

        it("should return 'question-mark' for MySQL and related databases", () => {
            const mysqlTypes: DatabaseType[] = [
                "mysql",
                "sqlite",
                "aurora-mysql",
            ]

            for (const type of mysqlTypes) {
                expect(SqlTagUtils.getParameterStrategy(type)).to.equal("question-mark")
            }
        })

        it("should return 'colon' for Oracle", () => {
            expect(SqlTagUtils.getParameterStrategy("oracle")).to.equal("colon")
        })

        it("should return 'at' for MSSQL", () => {
            expect(SqlTagUtils.getParameterStrategy("mssql")).to.equal("at")
        })

        it("should return 'unknown' for unsupported database types", () => {
            expect(SqlTagUtils.getParameterStrategy("unsupported" as DatabaseType)).to.equal("unknown")
        })
    })

    describe("buildSqlTag", () => {
        const createTemplateStrings = (strings: string[]): TemplateStringsArray => {
            const result = Object.freeze([...strings]) as unknown as TemplateStringsArray
            Object.defineProperty(result, "raw", {
                value: Object.freeze([...strings]),
                writable: false,
                configurable: false,
            })
            return result
        }

        const testCases = [
            {
                name: "PostgreSQL style parameters",
                databaseType: "postgres" as DatabaseType,
                strings: createTemplateStrings(["SELECT * FROM table WHERE id = ", " AND name = ", ""]),
                expressions: [1, "test"],
                expectedQuery: "SELECT * FROM table WHERE id = $1 AND name = $2",
                expectedVariables: [1, "test"],
            },
            {
                name: "MySQL style parameters",
                databaseType: "mysql" as DatabaseType,
                strings: createTemplateStrings(["SELECT * FROM table WHERE id = ", " AND name = ", ""]),
                expressions: [1, "test"],
                expectedQuery: "SELECT * FROM table WHERE id = ? AND name = ?",
                expectedVariables: [1, "test"],
            },
            {
                name: "Oracle style parameters",
                databaseType: "oracle" as DatabaseType,
                strings: createTemplateStrings(["SELECT * FROM table WHERE id = ", " AND name = ", ""]),
                expressions: [1, "test"],
                expectedQuery: "SELECT * FROM table WHERE id = :1 AND name = :2",
                expectedVariables: [1, "test"],
            },
            {
                name: "MSSQL style parameters",
                databaseType: "mssql" as DatabaseType,
                strings: createTemplateStrings(["SELECT * FROM table WHERE id = ", " AND name = ", ""]),
                expressions: [1, "test"],
                expectedQuery: "SELECT * FROM table WHERE id = @1 AND name = @2",
                expectedVariables: [1, "test"],
            },
            {
                name: "Empty expressions",
                databaseType: "postgres" as DatabaseType,
                strings: createTemplateStrings(["SELECT * FROM table"]),
                expressions: [],
                expectedQuery: "SELECT * FROM table",
                expectedVariables: [],
            },
            {
                name: "Complex query with multiple parameters",
                databaseType: "postgres" as DatabaseType,
                strings: createTemplateStrings([
                    "SELECT * FROM table WHERE id IN (",
                    ") AND name LIKE ",
                    " AND active = ",
                    "",
                ]),
                expressions: [[1, 2, 3], "%test%", true],
                expectedQuery: "SELECT * FROM table WHERE id IN ($1) AND name LIKE $2 AND active = $3",
                expectedVariables: [[1, 2, 3], "%test%", true],
            },
            {
                name: "Query with NULL values",
                databaseType: "postgres" as DatabaseType,
                strings: createTemplateStrings(["SELECT * FROM table WHERE value IS ", ""]),
                expressions: [null],
                expectedQuery: "SELECT * FROM table WHERE value IS $1",
                expectedVariables: [null],
            },
            {
                name: "Query with date values",
                databaseType: "postgres" as DatabaseType,
                strings: createTemplateStrings(["SELECT * FROM table WHERE created_at > ", ""]),
                expressions: [new Date("2023-01-01")],
                expectedQuery: "SELECT * FROM table WHERE created_at > $1",
                expectedVariables: [new Date("2023-01-01")],
            },
        ]

        for (const testCase of testCases) {
            it(`should build SQL tag correctly for ${testCase.name}`, () => {
                const result = SqlTagUtils.buildSqlTag({
                    databaseType: testCase.databaseType,
                    strings: testCase.strings,
                    expressions: testCase.expressions,
                })

                expect(result.query).to.equal(testCase.expectedQuery)
                expect(result.variables).to.deep.equal(testCase.expectedVariables)
            })
        }

        it("should throw error for unsupported database type", () => {
            expect(() =>
                SqlTagUtils.buildSqlTag({
                    databaseType: "unsupported" as DatabaseType,
                    strings: createTemplateStrings(["SELECT * FROM table WHERE id = ", ""]),
                    expressions: [1],
                }),
            ).to.throw("This database engine does not support parameters")
        })
    })
})
