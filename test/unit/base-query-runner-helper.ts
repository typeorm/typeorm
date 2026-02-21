import { expect } from "chai"
import { isSafeAlter } from "../../src/query-runner/BaseQueryRunnerHelper"

type PartialTableColumn = {
    type?: string
    length?: string | number
    precision?: number | null
    scale?: number | null
}

function col(partial: PartialTableColumn = {}) {
    // minimal shape that isSafeAlter reads
    return {
        type: partial.type ?? "",
        length:
            typeof partial.length === "number"
                ? String(partial.length)
                : partial.length ?? "",
        precision: partial.precision ?? null,
        scale: partial.scale ?? null,
    } as any
}

describe("BaseQueryRunnerHelper.isSafeAlter", () => {
    describe("varchar/char/text families", () => {
        it("allows widening: VARCHAR(50) -> VARCHAR(100)", () => {
            const oldC = col({ type: "varchar(50)" })
            const newC = col({ type: "varchar(100)" })
            expect(isSafeAlter(oldC as any, newC as any)).to.equal(true)
        })

        it("blocks narrowing: VARCHAR(100) -> VARCHAR(50)", () => {
            const oldC = col({ type: "varchar(100)" })
            const newC = col({ type: "varchar(50)" })
            expect(isSafeAlter(oldC as any, newC as any)).to.equal(false)
        })

        it("allows CHAR(N) -> VARCHAR(M) when M ≥ N", () => {
            const oldC = col({ type: "char(10)" })
            const newC = col({ type: "varchar(10)" })
            expect(isSafeAlter(oldC as any, newC as any)).to.equal(true)
        })

        it("blocks CHAR(N) -> VARCHAR(M) when M < N", () => {
            const oldC = col({ type: "char(10)" })
            const newC = col({ type: "varchar(8)" })
            expect(isSafeAlter(oldC as any, newC as any)).to.equal(false)
        })

        it("allows VARCHAR(*) -> TEXT/NTEXT/CLOB as capacity-widening", () => {
            const cases = ["text", "ntext", "clob"]
            for (const target of cases) {
                const oldC = col({ type: "varchar(255)" })
                const newC = col({ type: target })
                expect(
                    isSafeAlter(oldC as any, newC as any),
                    `varchar -> ${target}`,
                ).to.equal(true)
            }
        })
    })

    describe("numeric families", () => {
        it("allows int-width up-rank: SMALLINT -> INT -> BIGINT", () => {
            const upCases: [string, string][] = [
                ["tinyint", "smallint"],
                ["smallint", "int"],
                ["int", "bigint"],
                ["integer", "bigint"],
            ]
            for (const [from, to] of upCases) {
                expect(
                    isSafeAlter(
                        col({ type: from }) as any,
                        col({ type: to }) as any,
                    ),
                ).to.equal(true, `${from} -> ${to} should be safe`)
            }
        })

        it("blocks int-width down-rank: BIGINT -> INT, INT -> SMALLINT", () => {
            const downCases: [string, string][] = [
                ["bigint", "int"],
                ["int", "smallint"],
                ["integer", "tinyint"],
            ]
            for (const [from, to] of downCases) {
                expect(
                    isSafeAlter(
                        col({ type: from }) as any,
                        col({ type: to }) as any,
                    ),
                ).to.equal(false, `${from} -> ${to} should be unsafe`)
            }
        })

        it("allows decimal widening: DECIMAL(10,2) -> DECIMAL(12,2)", () => {
            const oldC = col({ type: "decimal(10,2)", precision: 10, scale: 2 })
            const newC = col({ type: "decimal(12,2)", precision: 12, scale: 2 })
            expect(isSafeAlter(oldC as any, newC as any)).to.equal(true)
        })

        it("blocks decimal narrowing of precision: DECIMAL(10,2) -> DECIMAL(8,2)", () => {
            const oldC = col({ type: "decimal(10,2)", precision: 10, scale: 2 })
            const newC = col({ type: "decimal(8,2)", precision: 8, scale: 2 })
            expect(isSafeAlter(oldC as any, newC as any)).to.equal(false)
        })

        it("allows increasing scale (more fractional digits): DECIMAL(10,2) -> DECIMAL(10,3)", () => {
            const oldC = col({ type: "decimal(10,2)", precision: 10, scale: 2 })
            const newC = col({ type: "decimal(10,3)", precision: 10, scale: 3 })
            expect(isSafeAlter(oldC as any, newC as any)).to.equal(true)
        })
    })

    describe("temporal families", () => {
        it("allows DATE -> TIMESTAMP/DATETIME*", () => {
            const cases = ["timestamp", "datetime", "datetime2", "datetime(6)"]
            for (const t of cases) {
                expect(
                    isSafeAlter(
                        col({ type: "date" }) as any,
                        col({ type: t }) as any,
                    ),
                ).to.equal(true, `date -> ${t}`)
            }
        })

        it("allows DATETIME* -> TIMESTAMP/DATETIME*", () => {
            const cases: [string, string][] = [
                ["datetime", "timestamp"],
                ["datetime", "datetime2"],
                ["datetime2", "timestamp"],
                ["datetime2", "datetime(6)"],
            ]
            for (const [from, to] of cases) {
                expect(
                    isSafeAlter(
                        col({ type: from }) as any,
                        col({ type: to }) as any,
                    ),
                ).to.equal(true, `${from} -> ${to}`)
            }
        })
    })

    describe("unsafe examples across families", () => {
        it("blocks VARCHAR -> INT (formal change)", () => {
            expect(
                isSafeAlter(
                    col({ type: "varchar(50)" }) as any,
                    col({ type: "int" }) as any,
                ),
            ).to.equal(false)
        })

        it("blocks INT -> VARCHAR (formal change)", () => {
            expect(
                isSafeAlter(
                    col({ type: "int" }) as any,
                    col({ type: "varchar(50)" }) as any,
                ),
            ).to.equal(false)
        })

        it("blocks TEXT -> VARCHAR(N) (potential truncation)", () => {
            expect(
                isSafeAlter(
                    col({ type: "text" }) as any,
                    col({ type: "varchar(255)" }) as any,
                ),
            ).to.equal(false)
        })
    })
})

describe("BaseQueryRunnerHelper.isSafeAlter – additional coverage", () => {
    // STRINGS
    describe("strings (widening only)", () => {
        it("allows NCHAR(N) -> NVARCHAR(M) when M ≥ N", () => {
            expect(
                isSafeAlter(
                    col({ type: "nchar(10)" }) as any,
                    col({ type: "nvarchar(12)" }) as any,
                ),
            ).to.equal(true)
            expect(
                isSafeAlter(
                    col({ type: "nchar(10)" }) as any,
                    col({ type: "nvarchar(10)" }) as any,
                ),
            ).to.equal(true)
        })

        it("blocks NCHAR(N) -> NVARCHAR(M) when M < N", () => {
            expect(
                isSafeAlter(
                    col({ type: "nchar(10)" }) as any,
                    col({ type: "nvarchar(8)" }) as any,
                ),
            ).to.equal(false)
        })

        it("allows NVARCHAR2 widening (Oracle): NVARCHAR2(50) -> NVARCHAR2(200)", () => {
            expect(
                isSafeAlter(
                    col({ type: "nvarchar2(50)" }) as any,
                    col({ type: "nvarchar2(200)" }) as any,
                ),
            ).to.equal(true)
        })

        it("blocks NVARCHAR2 narrowing: NVARCHAR2(200) -> NVARCHAR2(50)", () => {
            expect(
                isSafeAlter(
                    col({ type: "nvarchar2(200)" }) as any,
                    col({ type: "nvarchar2(50)" }) as any,
                ),
            ).to.equal(false)
        })
    })

    // NUMERICS
    describe("numerics (widening precision/width)", () => {
        it("allows unparameterized -> parameterized decimal: DECIMAL -> DECIMAL(10,2)", () => {
            // When old column had no explicit precision/scale, specifying a (safe) one should be allowed.
            expect(
                isSafeAlter(
                    col({ type: "decimal" }) as any,
                    col({
                        type: "decimal(10,2)",
                        precision: 10,
                        scale: 2,
                    }) as any,
                ),
            ).to.equal(true)
            // And keep existing passing case: DECIMAL(10,2) -> DECIMAL(12,2) already in your suite
        })

        it("allows float/real/double widening: FLOAT -> DOUBLE, REAL -> DOUBLE", () => {
            expect(
                isSafeAlter(
                    col({ type: "float" }) as any,
                    col({ type: "double" }) as any,
                ),
            ).to.equal(true)
            expect(
                isSafeAlter(
                    col({ type: "real" }) as any,
                    col({ type: "double" }) as any,
                ),
            ).to.equal(true)
        })

        it("treats FLOAT ↔ REAL as equivalent / safe lateral change", () => {
            expect(
                isSafeAlter(
                    col({ type: "float" }) as any,
                    col({ type: "real" }) as any,
                ),
            ).to.equal(true)
            expect(
                isSafeAlter(
                    col({ type: "real" }) as any,
                    col({ type: "float" }) as any,
                ),
            ).to.equal(true)
        })
    })

    // TEMPORALS
    describe("temporals", () => {
        it("allows TIME fractional precision widening: TIME(3) -> TIME(6)", () => {
            expect(
                isSafeAlter(
                    col({ type: "time(3)" }) as any,
                    col({ type: "time(6)" }) as any,
                ),
            ).to.equal(true)
        })

        it("allows TIME narrowing: TIME(6) -> TIME(3)", () => {
            expect(
                isSafeAlter(
                    col({ type: "time(6)" }) as any,
                    col({ type: "time(3)" }) as any,
                ),
            ).to.equal(true)
        })

        it("widening within datetime family: DATETIME -> DATETIME2 / DATETIMEOFFSET", () => {
            expect(
                isSafeAlter(
                    col({ type: "datetime" }) as any,
                    col({ type: "datetime2" }) as any,
                ),
            ).to.equal(true)
            expect(
                isSafeAlter(
                    col({ type: "datetime" }) as any,
                    col({ type: "datetimeoffset" }) as any,
                ),
            ).to.equal(true)
        })

        it("widening within datetime family: DATETIME2 -> DATETIMEOFFSET", () => {
            expect(
                isSafeAlter(
                    col({ type: "datetime2" }) as any,
                    col({ type: "datetimeoffset" }) as any,
                ),
            ).to.equal(true)
        })
    })

    // NO-CHANGE
    describe("no change (normalized equal)", () => {
        it("exact same normalized type string with params: VARCHAR(100) -> VARCHAR(100)", () => {
            expect(
                isSafeAlter(
                    col({ type: "varchar(100)" }) as any,
                    col({ type: "varchar(100)" }) as any,
                ),
            ).to.equal(true)
        })

        it("exact same normalized type without params: TIMESTAMP -> TIMESTAMP", () => {
            expect(
                isSafeAlter(
                    col({ type: "timestamp" }) as any,
                    col({ type: "timestamp" }) as any,
                ),
            ).to.equal(true)
        })
    })
})
