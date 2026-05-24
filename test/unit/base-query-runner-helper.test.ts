import { expect } from "chai"
import { TableColumn } from "../../src/schema-builder/table/TableColumn"
import { isSafeAlter } from "../../src/query-runner/BaseQueryRunnerHelper"

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
