import { expect } from "chai"
import { TableColumn } from "../../src/schema-builder/table/TableColumn"
import {
    isSafeAlter,
    normalizeColumnLength,
} from "../../src/query-runner/BaseQueryRunnerHelper"

type ColumnInput = Partial<ConstructorParameters<typeof TableColumn>[0]>

function col(options: ColumnInput = {}): TableColumn {
    return new TableColumn({
        name: "test_col",
        type: "",
        ...options,
        length:
            typeof options.length === "number"
                ? String(options.length)
                : options.length,
        precision: options.precision ?? undefined,
        scale: options.scale ?? undefined,
    })
}

describe("BaseQueryRunnerHelper.isSafeAlter", () => {
    describe("varchar/char/text families", () => {
        const cases = [
            {
                title: "allows widening: VARCHAR(50) -> VARCHAR(100)",
                oldColumn: col({ type: "varchar(50)" }),
                newColumn: col({ type: "varchar(100)" }),
                expected: true,
            },
            {
                title: "blocks narrowing: VARCHAR(100) -> VARCHAR(50)",
                oldColumn: col({ type: "varchar(100)" }),
                newColumn: col({ type: "varchar(50)" }),
                expected: false,
            },
            {
                title: "allows CHAR(N) -> VARCHAR(M) when M ≥ N",
                oldColumn: col({ type: "char(10)" }),
                newColumn: col({ type: "varchar(10)" }),
                expected: true,
            },
            {
                title: "blocks CHAR(N) -> VARCHAR(M) when M < N",
                oldColumn: col({ type: "char(10)" }),
                newColumn: col({ type: "varchar(8)" }),
                expected: false,
            },
            {
                title: "allows VARCHAR(*) -> TEXT as capacity-widening",
                oldColumn: col({ type: "varchar(255)" }),
                newColumn: col({ type: "text" }),
                expected: true,
            },
            {
                title: "allows VARCHAR(*) -> NTEXT as capacity-widening",
                oldColumn: col({ type: "varchar(255)" }),
                newColumn: col({ type: "ntext" }),
                expected: true,
            },
            {
                title: "allows VARCHAR(*) -> CLOB as capacity-widening",
                oldColumn: col({ type: "varchar(255)" }),
                newColumn: col({ type: "clob" }),
                expected: true,
            },
        ]

        for (const testCase of cases) {
            it(testCase.title, () => {
                expect(
                    isSafeAlter(testCase.oldColumn, testCase.newColumn),
                ).to.equal(testCase.expected)
            })
        }
    })

    describe("numeric families", () => {
        const cases = [
            {
                title: "allows int-width up-rank: TINYINT -> SMALLINT",
                oldColumn: col({ type: "tinyint" }),
                newColumn: col({ type: "smallint" }),
                expected: true,
            },
            {
                title: "allows int-width up-rank: SMALLINT -> INT",
                oldColumn: col({ type: "smallint" }),
                newColumn: col({ type: "int" }),
                expected: true,
            },
            {
                title: "allows int-width up-rank: INT -> BIGINT",
                oldColumn: col({ type: "int" }),
                newColumn: col({ type: "bigint" }),
                expected: true,
            },
            {
                title: "blocks int-width down-rank: BIGINT -> INT",
                oldColumn: col({ type: "bigint" }),
                newColumn: col({ type: "int" }),
                expected: false,
            },
            {
                title: "blocks decimal narrowing of precision: DECIMAL(10,2) -> DECIMAL(8,2)",
                oldColumn: col({
                    type: "decimal(10,2)",
                    precision: 10,
                    scale: 2,
                }),
                newColumn: col({
                    type: "decimal(8,2)",
                    precision: 8,
                    scale: 2,
                }),
                expected: false,
            },
        ]

        for (const testCase of cases) {
            it(testCase.title, () => {
                expect(
                    isSafeAlter(testCase.oldColumn, testCase.newColumn),
                ).to.equal(testCase.expected)
            })
        }
    })

    describe("temporal families", () => {
        const cases = [
            {
                title: "allows DATE -> TIMESTAMP",
                oldColumn: col({ type: "date" }),
                newColumn: col({ type: "timestamp" }),
                expected: true,
            },
            {
                title: "allows DATE -> DATETIME",
                oldColumn: col({ type: "date" }),
                newColumn: col({ type: "datetime" }),
                expected: true,
            },
            {
                title: "allows DATETIME -> DATETIME2",
                oldColumn: col({ type: "datetime" }),
                newColumn: col({ type: "datetime2" }),
                expected: true,
            },
        ]

        for (const testCase of cases) {
            it(testCase.title, () => {
                expect(
                    isSafeAlter(testCase.oldColumn, testCase.newColumn),
                ).to.equal(testCase.expected)
            })
        }
    })

    describe("unsafe examples across families", () => {
        const cases = [
            {
                title: "blocks VARCHAR -> INT (formal change)",
                oldColumn: col({ type: "varchar(50)" }),
                newColumn: col({ type: "int" }),
                expected: false,
            },
            {
                title: "blocks INT -> VARCHAR (formal change)",
                oldColumn: col({ type: "int" }),
                newColumn: col({ type: "varchar(50)" }),
                expected: false,
            },
            {
                title: "blocks TEXT -> VARCHAR(N) (potential truncation)",
                oldColumn: col({ type: "text" }),
                newColumn: col({ type: "varchar(255)" }),
                expected: false,
            },
        ]

        for (const testCase of cases) {
            it(testCase.title, () => {
                expect(
                    isSafeAlter(testCase.oldColumn, testCase.newColumn),
                ).to.equal(testCase.expected)
            })
        }
    })
})

describe("BaseQueryRunnerHelper.isSafeAlter – additional coverage", () => {
    // STRINGS
    describe("strings (widening only)", () => {
        const cases = [
            {
                title: "allows NCHAR(N) -> NVARCHAR(M) when M ≥ N",
                oldColumn: col({ type: "nchar(10)" }),
                newColumn: col({ type: "nvarchar(12)" }),
                expected: true,
            },
            {
                title: "allows NCHAR(N) -> NVARCHAR(M) when M = N",
                oldColumn: col({ type: "nchar(10)" }),
                newColumn: col({ type: "nvarchar(10)" }),
                expected: true,
            },
            {
                title: "blocks NCHAR(N) -> NVARCHAR(M) when M < N",
                oldColumn: col({ type: "nchar(10)" }),
                newColumn: col({ type: "nvarchar(8)" }),
                expected: false,
            },
        ]

        for (const testCase of cases) {
            it(testCase.title, () => {
                expect(
                    isSafeAlter(testCase.oldColumn, testCase.newColumn),
                ).to.equal(testCase.expected)
            })
        }
    })

    // NUMERICS
    describe("numerics (widening precision/width)", () => {
        const cases = [
            {
                title: "allows unparameterized -> parameterized decimal: DECIMAL -> DECIMAL(10,2)",
                oldColumn: col({ type: "decimal" }),
                newColumn: col({
                    type: "decimal(10,2)",
                    precision: 10,
                    scale: 2,
                }),
                expected: true,
            },
            {
                title: "allows float widening: FLOAT -> DOUBLE",
                oldColumn: col({ type: "float" }),
                newColumn: col({ type: "double" }),
                expected: true,
            },
            {
                title: "allows real widening: REAL -> DOUBLE",
                oldColumn: col({ type: "real" }),
                newColumn: col({ type: "double" }),
                expected: true,
            },
            {
                title: "treats FLOAT -> REAL as equivalent / safe lateral change",
                oldColumn: col({ type: "float" }),
                newColumn: col({ type: "real" }),
                expected: true,
            },
            {
                title: "treats REAL -> FLOAT as equivalent / safe lateral change",
                oldColumn: col({ type: "real" }),
                newColumn: col({ type: "float" }),
                expected: true,
            },
        ]

        for (const testCase of cases) {
            it(testCase.title, () => {
                expect(
                    isSafeAlter(testCase.oldColumn, testCase.newColumn),
                ).to.equal(testCase.expected)
            })
        }
    })

    // TEMPORALS
    describe("temporals", () => {
        const cases = [
            {
                title: "allows TIME fractional precision widening: TIME(3) -> TIME(6)",
                oldColumn: col({ type: "time(3)" }),
                newColumn: col({ type: "time(6)" }),
                expected: true,
            },
            {
                title: "allows TIME narrowing: TIME(6) -> TIME(3)",
                oldColumn: col({ type: "time(6)" }),
                newColumn: col({ type: "time(3)" }),
                expected: true,
            },
            {
                title: "allows widening within datetime family: DATETIME -> DATETIME2",
                oldColumn: col({ type: "datetime" }),
                newColumn: col({ type: "datetime2" }),
                expected: true,
            },
            {
                title: "allows widening within datetime family: DATETIME -> DATETIMEOFFSET",
                oldColumn: col({ type: "datetime" }),
                newColumn: col({ type: "datetimeoffset" }),
                expected: true,
            },
            {
                title: "allows widening within datetime family: DATETIME2 -> DATETIMEOFFSET",
                oldColumn: col({ type: "datetime2" }),
                newColumn: col({ type: "datetimeoffset" }),
                expected: true,
            },
        ]

        for (const testCase of cases) {
            it(testCase.title, () => {
                expect(
                    isSafeAlter(testCase.oldColumn, testCase.newColumn),
                ).to.equal(testCase.expected)
            })
        }
    })

    // NO-CHANGE
    describe("no change (normalized equal)", () => {
        const cases = [
            {
                title: "exact same normalized type string with params: VARCHAR(100) -> VARCHAR(100)",
                oldColumn: col({ type: "varchar(100)" }),
                newColumn: col({ type: "varchar(100)" }),
                expected: true,
            },
            {
                title: "exact same normalized type without params: TIMESTAMP -> TIMESTAMP",
                oldColumn: col({ type: "timestamp" }),
                newColumn: col({ type: "timestamp" }),
                expected: true,
            },
        ]

        for (const testCase of cases) {
            it(testCase.title, () => {
                expect(
                    isSafeAlter(testCase.oldColumn, testCase.newColumn),
                ).to.equal(testCase.expected)
            })
        }
    })
})

describe("BaseQueryRunnerHelper.isSafeAlter – branch coverage", () => {
    // Lines 184-187: special families always block within-family alters
    describe("special families block same-family alters", () => {
        it("blocks BOOLEAN -> BOOLEAN", () => {
            expect(
                isSafeAlter(col({ type: "boolean" }), col({ type: "boolean" })),
            ).to.equal(false)
        })
        it("blocks BIT -> BOOL", () => {
            expect(
                isSafeAlter(col({ type: "bit" }), col({ type: "bool" })),
            ).to.equal(false)
        })
        it("blocks ENUM -> ENUM", () => {
            expect(
                isSafeAlter(col({ type: "enum" }), col({ type: "enum" })),
            ).to.equal(false)
        })
        it("blocks SET -> SET", () => {
            expect(
                isSafeAlter(col({ type: "set" }), col({ type: "set" })),
            ).to.equal(false)
        })
        it("blocks UUID -> UUID", () => {
            expect(
                isSafeAlter(col({ type: "uuid" }), col({ type: "uuid" })),
            ).to.equal(false)
        })
        it("blocks BINARY -> BINARY", () => {
            expect(
                isSafeAlter(col({ type: "binary" }), col({ type: "binary" })),
            ).to.equal(false)
        })
        it("blocks BYTEA -> BYTEA", () => {
            expect(
                isSafeAlter(col({ type: "bytea" }), col({ type: "bytea" })),
            ).to.equal(false)
        })
    })

    // Lines 205, 213, 221: unicode encoding mismatch blocks within-family alters
    describe("unicode encoding mismatch blocks string alter", () => {
        it("blocks NCHAR(N) -> VARCHAR(M): unicode mismatch in char->varchar path", () => {
            expect(
                isSafeAlter(
                    col({ type: "nchar(10)" }),
                    col({ type: "varchar(20)" }),
                ),
            ).to.equal(false)
        })
        it("blocks CHAR(N) -> NVARCHAR(M): unicode mismatch in char->varchar path", () => {
            expect(
                isSafeAlter(
                    col({ type: "char(10)" }),
                    col({ type: "nvarchar(20)" }),
                ),
            ).to.equal(false)
        })
        it("blocks NCHAR(N) -> CHAR(M): unicode mismatch in char->char path", () => {
            expect(
                isSafeAlter(
                    col({ type: "nchar(10)" }),
                    col({ type: "char(20)" }),
                ),
            ).to.equal(false)
        })
        it("blocks VARCHAR(N) -> NVARCHAR(M): unicode mismatch in varchar->varchar path", () => {
            expect(
                isSafeAlter(
                    col({ type: "varchar(100)" }),
                    col({ type: "nvarchar(100)" }),
                ),
            ).to.equal(false)
        })
    })

    // Lines 206, 222: unknown lengths assume widening (early return true)
    describe("unknown string lengths assume widening", () => {
        it("allows CHAR -> VARCHAR when both lengths unknown", () => {
            expect(
                isSafeAlter(col({ type: "char" }), col({ type: "varchar" })),
            ).to.equal(true)
        })
        it("allows NCHAR -> NVARCHAR when new length unknown", () => {
            expect(
                isSafeAlter(
                    col({ type: "nchar(10)" }),
                    col({ type: "nvarchar" }),
                ),
            ).to.equal(true)
        })
        it("allows CHAR(N) -> VARCHAR when new length unknown", () => {
            expect(
                isSafeAlter(
                    col({ type: "char(10)" }),
                    col({ type: "varchar" }),
                ),
            ).to.equal(true)
        })
    })

    // Line 229: STR family fallthrough (non-char/varchar transitions)
    describe("string family fallthrough blocks unsupported transitions", () => {
        it("blocks JSON -> XML (both STR family, no handler matched)", () => {
            expect(
                isSafeAlter(col({ type: "json" }), col({ type: "xml" })),
            ).to.equal(false)
        })
        it("blocks NTEXT -> CLOB (text-likes but not varchar->textLike direction)", () => {
            expect(
                isSafeAlter(col({ type: "ntext" }), col({ type: "clob" })),
            ).to.equal(false)
        })
        it("blocks TEXT -> VARCHAR(N) (reverse of allowed varchar->text)", () => {
            expect(
                isSafeAlter(
                    col({ type: "text" }),
                    col({ type: "varchar(255)" }),
                ),
            ).to.equal(false)
        })
    })

    // Lines 260-261: decimal precision/scale widening
    describe("decimal precision and scale widening", () => {
        it("allows strictly larger precision: DECIMAL(8,2) -> DECIMAL(12,4)", () => {
            expect(
                isSafeAlter(
                    col({ type: "decimal(8,2)", precision: 8, scale: 2 }),
                    col({ type: "decimal(12,4)", precision: 12, scale: 4 }),
                ),
            ).to.equal(true)
        })
        it("allows same precision with more scale: DECIMAL(10,2) -> DECIMAL(10,4)", () => {
            expect(
                isSafeAlter(
                    col({ type: "decimal(10,2)", precision: 10, scale: 2 }),
                    col({ type: "decimal(10,4)", precision: 10, scale: 4 }),
                ),
            ).to.equal(true)
        })
        it("blocks same precision with less scale: DECIMAL(10,4) -> DECIMAL(10,2)", () => {
            expect(
                isSafeAlter(
                    col({ type: "decimal(10,4)", precision: 10, scale: 4 }),
                    col({ type: "decimal(10,2)", precision: 10, scale: 2 }),
                ),
            ).to.equal(false)
        })
    })

    // Line 282: numeric family fallthrough (mixed int/float/decimal)
    describe("numeric cross-type fallthrough", () => {
        it("blocks FLOAT -> DECIMAL: no widening path between float and decimal families", () => {
            expect(
                isSafeAlter(
                    col({ type: "float" }),
                    col({ type: "decimal(10,2)" }),
                ),
            ).to.equal(false)
        })
        it("blocks INT -> FLOAT: no widening path between integer and float families", () => {
            expect(
                isSafeAlter(col({ type: "int" }), col({ type: "float" })),
            ).to.equal(false)
        })
    })

    // Line 300: datetime* -> timestamp widening (untested direction)
    describe("datetime* -> timestamp widening", () => {
        it("allows DATETIME -> TIMESTAMP", () => {
            expect(
                isSafeAlter(
                    col({ type: "datetime" }),
                    col({ type: "timestamp" }),
                ),
            ).to.equal(true)
        })
        it("allows DATE -> DATETIME2", () => {
            expect(
                isSafeAlter(col({ type: "date" }), col({ type: "datetime2" })),
            ).to.equal(true)
        })
        it("allows DATE -> DATETIMEOFFSET", () => {
            expect(
                isSafeAlter(
                    col({ type: "date" }),
                    col({ type: "datetimeoffset" }),
                ),
            ).to.equal(true)
        })
    })

    // Line 306: temporal fallthrough (narrowing / unsupported)
    describe("temporal narrowing blocks alter", () => {
        it("blocks TIMESTAMP -> DATE (narrowing)", () => {
            expect(
                isSafeAlter(col({ type: "timestamp" }), col({ type: "date" })),
            ).to.equal(false)
        })
        it("blocks TIMESTAMP -> TIME (narrowing)", () => {
            expect(
                isSafeAlter(col({ type: "timestamp" }), col({ type: "time" })),
            ).to.equal(false)
        })
        it("blocks TIMESTAMPTZ -> TIMESTAMP (neither date nor datetime* path)", () => {
            expect(
                isSafeAlter(
                    col({ type: "timestamptz" }),
                    col({ type: "timestamp" }),
                ),
            ).to.equal(false)
        })
        it("blocks DATETIME -> DATE (narrowing)", () => {
            expect(
                isSafeAlter(col({ type: "datetime" }), col({ type: "date" })),
            ).to.equal(false)
        })
    })
})

// normalizeColumnLength has 0% coverage — it is exported but not imported in the test file
describe("BaseQueryRunnerHelper.normalizeColumnLength", () => {
    it("returns undefined for null", () => {
        expect(normalizeColumnLength(null)).to.equal(undefined)
    })
    it("returns undefined for undefined", () => {
        expect(normalizeColumnLength(undefined)).to.equal(undefined)
    })
    it("returns undefined for empty string", () => {
        expect(normalizeColumnLength("")).to.equal(undefined)
    })
    it("returns the number for a numeric input", () => {
        expect(normalizeColumnLength(42)).to.equal(42)
    })
    it("parses a numeric string", () => {
        expect(normalizeColumnLength("100")).to.equal(100)
    })
    it("returns undefined for a non-numeric string", () => {
        expect(normalizeColumnLength("abc")).to.equal(undefined)
    })
    it("returns 0 for '0' (falsy but finite)", () => {
        expect(normalizeColumnLength("0")).to.equal(0)
    })
    it("truncates a float string to integer (parseInt behaviour)", () => {
        expect(normalizeColumnLength("10.9")).to.equal(10)
    })
    it("returns undefined for Infinity (not finite)", () => {
        expect(normalizeColumnLength(Infinity)).to.equal(undefined)
    })
})
