import { expect } from "chai"
import { BigintValueHandler } from "../../../src/metadata/value-handlers/handlers/BigintValueHandler"
import { DateValueHandler } from "../../../src/metadata/value-handlers/handlers/DateValueHandler"
import { TimeValueHandler } from "../../../src/metadata/value-handlers/handlers/TimeValueHandler"
import { DateTimeValueHandler } from "../../../src/metadata/value-handlers/handlers/DateTimeValueHandler"
import { JsonValueHandler } from "../../../src/metadata/value-handlers/handlers/JsonValueHandler"
import { SimpleArrayValueHandler } from "../../../src/metadata/value-handlers/handlers/SimpleArrayValueHandler"
import { SimpleEnumValueHandler } from "../../../src/metadata/value-handlers/handlers/SimpleEnumValueHandler"
import { SimpleJsonValueHandler } from "../../../src/metadata/value-handlers/handlers/SimpleJsonValueHandler"
import { ValueHandlers } from "../../../src/metadata/value-handlers/ValueHandlers"
import { resolveValueHandler } from "../../../src/metadata/value-handlers/resolveValueHandler"
import type { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"

describe("value-handlers", () => {
    describe("BigintValueHandler", () => {
        describe("normalize", () => {
            it("converts number to string", () => {
                expect(BigintValueHandler.normalize(123)).to.equal("123")
            })

            it("converts bigint to string", () => {
                expect(BigintValueHandler.normalize(BigInt(999))).to.equal(
                    "999",
                )
            })

            it("passes string through", () => {
                expect(BigintValueHandler.normalize("456")).to.equal("456")
            })

            it("preserves null", () => {
                expect(BigintValueHandler.normalize(null)).to.equal(null)
            })

            it("preserves undefined", () => {
                expect(BigintValueHandler.normalize(undefined)).to.equal(
                    undefined,
                )
            })

            it("does not coerce non-primitive values (security)", () => {
                const obj = { toString: () => "evil" }
                expect(BigintValueHandler.normalize(obj)).to.equal(obj)
            })

            it("preserves precision beyond MAX_SAFE_INTEGER", () => {
                const big = "9007199254740993"
                expect(BigintValueHandler.normalize(big)).to.equal(big)
            })
        })

        describe("areEqual", () => {
            it("returns true for identical strings", () => {
                expect(BigintValueHandler.areEqual("1", "1")).to.be.true
            })

            it("returns false for different strings", () => {
                expect(BigintValueHandler.areEqual("1", "2")).to.be.false
            })

            it("returns false for string vs number (strict ===)", () => {
                expect(BigintValueHandler.areEqual("1", 1 as any)).to.be.false
            })
        })
    })

    describe("DateValueHandler", () => {
        describe("normalize", () => {
            it("is identity", () => {
                const d = new Date()
                expect(DateValueHandler.normalize(d)).to.equal(d)
            })
        })

        describe("areEqual", () => {
            it("compares Date objects by date string", () => {
                const a = new Date("2024-01-15T10:00:00Z")
                const b = new Date("2024-01-15T22:00:00Z")
                expect(DateValueHandler.areEqual(a, b)).to.be.true
            })

            it("compares string dates", () => {
                expect(DateValueHandler.areEqual("2024-01-15", "2024-01-15")).to
                    .be.true
            })

            it("returns false for different dates", () => {
                expect(DateValueHandler.areEqual("2024-01-15", "2024-01-16")).to
                    .be.false
            })
        })
    })

    describe("TimeValueHandler", () => {
        describe("areEqual", () => {
            it("compares time strings", () => {
                expect(TimeValueHandler.areEqual("10:30:00", "10:30:00")).to.be
                    .true
            })

            it("returns false for different times", () => {
                expect(TimeValueHandler.areEqual("10:30:00", "10:31:00")).to.be
                    .false
            })
        })
    })

    describe("DateTimeValueHandler", () => {
        describe("areEqual", () => {
            it("compares Date objects by UTC datetime string", () => {
                const a = new Date("2024-01-15T10:30:00Z")
                const b = new Date("2024-01-15T10:30:00Z")
                expect(DateTimeValueHandler.areEqual(a, b)).to.be.true
            })

            it("returns false for different datetimes", () => {
                const a = new Date("2024-01-15T10:30:00Z")
                const b = new Date("2024-01-15T10:30:01Z")
                expect(DateTimeValueHandler.areEqual(a, b)).to.be.false
            })
        })
    })

    describe("JsonValueHandler", () => {
        describe("areEqual", () => {
            it("compares objects deeply", () => {
                expect(JsonValueHandler.areEqual({ a: 1 }, { a: 1 })).to.be.true
            })

            it("returns false for different objects", () => {
                expect(JsonValueHandler.areEqual({ a: 1 }, { a: 2 })).to.be
                    .false
            })

            it("handles nested objects", () => {
                expect(
                    JsonValueHandler.areEqual(
                        { a: { b: [1, 2] } },
                        { a: { b: [1, 2] } },
                    ),
                ).to.be.true
            })

            it("handles reordered keys", () => {
                expect(
                    JsonValueHandler.areEqual({ a: 1, b: 2 }, { b: 2, a: 1 }),
                ).to.be.true
            })
        })
    })

    describe("SimpleArrayValueHandler", () => {
        describe("areEqual", () => {
            it("compares arrays by joined string", () => {
                expect(SimpleArrayValueHandler.areEqual([1, 2, 3], [1, 2, 3]))
                    .to.be.true
            })

            it("returns false for different arrays", () => {
                expect(SimpleArrayValueHandler.areEqual([1, 2], [1, 3])).to.be
                    .false
            })

            it("compares string values directly", () => {
                expect(SimpleArrayValueHandler.areEqual("a,b", "a,b")).to.be
                    .true
            })
        })
    })

    describe("SimpleEnumValueHandler", () => {
        describe("areEqual", () => {
            it("compares enum arrays by joined string", () => {
                expect(SimpleEnumValueHandler.areEqual(["A", "B"], ["A", "B"]))
                    .to.be.true
            })

            it("returns false for different enum values", () => {
                expect(SimpleEnumValueHandler.areEqual("A", "B")).to.be.false
            })
        })
    })

    describe("SimpleJsonValueHandler", () => {
        describe("areEqual", () => {
            it("compares by JSON string", () => {
                expect(SimpleJsonValueHandler.areEqual({ a: 1 }, { a: 1 })).to
                    .be.true
            })

            it("returns false for different JSON", () => {
                expect(SimpleJsonValueHandler.areEqual({ a: 1 }, { a: 2 })).to
                    .be.false
            })
        })
    })

    describe("ValueHandlers.defaultHandler", () => {
        describe("normalize", () => {
            it("is identity", () => {
                expect(ValueHandlers.defaultHandler.normalize(42)).to.equal(42)
                expect(ValueHandlers.defaultHandler.normalize("str")).to.equal(
                    "str",
                )
                expect(ValueHandlers.defaultHandler.normalize(null)).to.equal(
                    null,
                )
            })
        })

        describe("areEqual", () => {
            it("uses strict equality", () => {
                expect(ValueHandlers.defaultHandler.areEqual(1, 1)).to.be.true
                expect(ValueHandlers.defaultHandler.areEqual("a", "a")).to.be
                    .true
            })

            it("returns false for type-mismatched values", () => {
                expect(
                    ValueHandlers.defaultHandler.areEqual(1 as any, "1" as any),
                ).to.be.false
            })

            it("compares Uint8Array contents", () => {
                const a = new Uint8Array([1, 2, 3])
                const b = new Uint8Array([1, 2, 3])
                expect(ValueHandlers.defaultHandler.areEqual(a, b)).to.be.true
            })

            it("returns false for different Uint8Array", () => {
                const a = new Uint8Array([1, 2, 3])
                const b = new Uint8Array([1, 2, 4])
                expect(ValueHandlers.defaultHandler.areEqual(a, b)).to.be.false
            })

            it("delegates to .equals() method", () => {
                const a = {
                    val: 1,
                    equals(other: any) {
                        return this.val === other.val
                    },
                }
                const b = { val: 1 }
                expect(ValueHandlers.defaultHandler.areEqual(a, b)).to.be.true
            })

            it("returns false for non-equal objects without .equals()", () => {
                expect(ValueHandlers.defaultHandler.areEqual({}, {})).to.be
                    .false
            })
        })
    })

    describe("resolveValueHandler", () => {
        function fakeColumn(
            overrides: Partial<ColumnMetadata>,
        ): ColumnMetadata {
            return overrides as ColumnMetadata
        }

        it("returns BigintValueHandler for bigint+increment", () => {
            const handler = resolveValueHandler(
                fakeColumn({
                    type: "bigint",
                    generationStrategy: "increment",
                }),
            )
            expect(handler).to.equal(BigintValueHandler)
        })

        it("returns BigintValueHandler for bigint+rowid", () => {
            const handler = resolveValueHandler(
                fakeColumn({ type: "bigint", generationStrategy: "rowid" }),
            )
            expect(handler).to.equal(BigintValueHandler)
        })

        it("returns ValueHandlers.defaultHandler for bigint without generation strategy", () => {
            const handler = resolveValueHandler(fakeColumn({ type: "bigint" }))
            expect(handler).to.equal(ValueHandlers.defaultHandler)
        })

        it("returns DateTimeValueHandler for Date constructor type", () => {
            const handler = resolveValueHandler(
                fakeColumn({ type: Date as any }),
            )
            expect(handler).to.equal(DateTimeValueHandler)
        })

        it("returns DateValueHandler for 'date'", () => {
            const handler = resolveValueHandler(fakeColumn({ type: "date" }))
            expect(handler).to.equal(DateValueHandler)
        })

        it("returns TimeValueHandler for time types", () => {
            for (const type of [
                "time",
                "time with time zone",
                "time without time zone",
                "timetz",
            ] as const) {
                const handler = resolveValueHandler(fakeColumn({ type }))
                expect(handler).to.equal(TimeValueHandler)
            }
        })

        it("returns DateTimeValueHandler for datetime types", () => {
            for (const type of [
                "datetime",
                "datetime2",
                "timestamp",
                "timestamp without time zone",
                "timestamp with time zone",
                "timestamp with local time zone",
                "timestamptz",
            ] as const) {
                const handler = resolveValueHandler(fakeColumn({ type }))
                expect(handler).to.equal(DateTimeValueHandler)
            }
        })

        it("returns JsonValueHandler for json/jsonb", () => {
            for (const type of ["json", "jsonb"] as const) {
                const handler = resolveValueHandler(fakeColumn({ type }))
                expect(handler).to.equal(JsonValueHandler)
            }
        })

        it("returns SimpleArrayValueHandler for simple-array", () => {
            const handler = resolveValueHandler(
                fakeColumn({ type: "simple-array" }),
            )
            expect(handler).to.equal(SimpleArrayValueHandler)
        })

        it("returns SimpleEnumValueHandler for simple-enum", () => {
            const handler = resolveValueHandler(
                fakeColumn({ type: "simple-enum" }),
            )
            expect(handler).to.equal(SimpleEnumValueHandler)
        })

        it("returns SimpleJsonValueHandler for simple-json", () => {
            const handler = resolveValueHandler(
                fakeColumn({ type: "simple-json" }),
            )
            expect(handler).to.equal(SimpleJsonValueHandler)
        })

        it("returns ValueHandlers.defaultHandler for unknown types", () => {
            const handler = resolveValueHandler(fakeColumn({ type: "varchar" }))
            expect(handler).to.equal(ValueHandlers.defaultHandler)
        })

        it("uses driver override when provided", () => {
            const customHandler = {
                normalize: (v: any) => v,
                areEqual: (a: any, b: any) => a === b,
            }
            const driver = {
                resolveValueHandler: () => customHandler,
            } as any

            const handler = resolveValueHandler(
                fakeColumn({ type: "varchar" }),
                driver,
            )
            expect(handler).to.equal(customHandler)
        })

        it("falls through when driver returns undefined", () => {
            const driver = {
                resolveValueHandler: () => undefined,
            } as any

            const handler = resolveValueHandler(
                fakeColumn({ type: "json" }),
                driver,
            )
            expect(handler).to.equal(JsonValueHandler)
        })
    })
})
