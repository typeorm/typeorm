import { expect } from "chai"
import { DeepPartial } from "../../../src"
import { OrmUtils } from "../../../src/util/OrmUtils"

describe(`OrmUtils`, () => {
    describe("parseSqlCheckExpression", () => {
        it("parses a simple CHECK constraint", () => {
            // Spaces between CHECK values
            expect(
                OrmUtils.parseSqlCheckExpression(
                    `CREATE TABLE "foo_table" (
                        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                        "col" varchar CHECK("col" IN ('FOO', 'BAR', 'BAZ')) NOT NULL,
                        "some_other_col" integer NOT NULL
                        );`,
                    "col",
                ),
            ).to.have.same.members(["FOO", "BAR", "BAZ"])

            // No spaces between CHECK values
            expect(
                OrmUtils.parseSqlCheckExpression(
                    `CREATE TABLE "foo_table" (
                        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                        "col" varchar CHECK("col" IN ('FOO','BAR','BAZ')) NOT NULL,
                        "some_other_col" integer NOT NULL
                        );`,
                    "col",
                ),
            ).to.have.same.members(["FOO", "BAR", "BAZ"])
        })

        it("returns undefined when the column doesn't have a CHECK", () => {
            expect(
                OrmUtils.parseSqlCheckExpression(
                    `CREATE TABLE "foo_table" (
                        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                        "col" varchar NOT NULL,
                        "some_other_col" integer NOT NULL
                        );`,
                    "col",
                ),
            ).to.equal(undefined)
        })

        it("parses a CHECK constraint with values containing special characters", () => {
            expect(
                OrmUtils.parseSqlCheckExpression(
                    `CREATE TABLE "foo_table" (
                        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                        "col" varchar CHECK("col" IN (
                                    'a,b',
                                    ',c,',
                                    'd''d',
                                    '''e''',
                                    'f'',''f',
                                    ''')',
                                    ')'''
                                )
                            ) NOT NULL,
                        "some_other_col" integer NOT NULL
                        );`,
                    "col",
                ),
            ).to.have.same.members([
                "a,b",
                ",c,",
                "d'd",
                "'e'",
                "f','f",
                "')",
                ")'",
            ])
        })
    })

    describe("mergeDeep", () => {
        it("should handle simple values.", () => {
            expect(OrmUtils.mergeDeep(1, 2)).to.equal(1)
            expect(OrmUtils.mergeDeep(2, 1)).to.equal(2)
            expect(OrmUtils.mergeDeep(2, 1, 1)).to.equal(2)
            expect(OrmUtils.mergeDeep(1, 2, 1)).to.equal(1)
            expect(OrmUtils.mergeDeep(1, 1, 2)).to.equal(1)
            expect(OrmUtils.mergeDeep(2, 1, 2)).to.equal(2)
        })

        it("should handle ordering and indempotence.", () => {
            const a = { a: 1 }
            const b = { a: 2 }
            expect(OrmUtils.mergeDeep(a, b)).to.deep.equal(b)
            expect(OrmUtils.mergeDeep(b, a)).to.deep.equal(a)
            expect(OrmUtils.mergeDeep(b, a, a)).to.deep.equal(a)
            expect(OrmUtils.mergeDeep(a, b, a)).to.deep.equal(a)
            expect(OrmUtils.mergeDeep(a, a, b)).to.deep.equal(b)
            expect(OrmUtils.mergeDeep(b, a, b)).to.deep.equal(b)
            const c = { a: 3 }
            expect(OrmUtils.mergeDeep(a, b, c)).to.deep.equal(c)
            expect(OrmUtils.mergeDeep(b, c, b)).to.deep.equal(b)
            expect(OrmUtils.mergeDeep(c, a, a)).to.deep.equal(a)
            expect(OrmUtils.mergeDeep(c, b, a)).to.deep.equal(a)
            expect(OrmUtils.mergeDeep(a, c, b)).to.deep.equal(b)
            expect(OrmUtils.mergeDeep(b, a, c)).to.deep.equal(c)
        })

        it("should skip nested promises in sources.", () => {
            expect(
                OrmUtils.mergeDeep({}, { p: Promise.resolve() }),
            ).to.deep.equal({})
            expect(
                OrmUtils.mergeDeep({}, { p: { p: Promise.resolve() } }),
            ).to.deep.equal({ p: {} })
            const a = { p: Promise.resolve(0) }
            const b = { p: Promise.resolve(1) }
            expect(OrmUtils.mergeDeep(a, {})).to.deep.equal(a)
            expect(OrmUtils.mergeDeep(a, b)).to.deep.equal(a)
            expect(OrmUtils.mergeDeep(b, a)).to.deep.equal(b)
            expect(OrmUtils.mergeDeep(b, {})).to.deep.equal(b)
        })

        it("should merge moderately deep objects correctly.", () => {
            const c = {
                a: { b: { c: { d: { e: 123, f: 99, h: { i: 23 } } }, f: 31 } },
                g: 19,
            }
            const a: DeepPartial<typeof c> = {
                a: { b: { c: { d: { e: 123, h: { i: 23 } } } } },
                g: 19,
            }
            const b: DeepPartial<typeof c> = {
                a: { b: { c: { d: { f: 99 } }, f: 31 } },
            }

            expect(OrmUtils.mergeDeep(a, b)).to.deep.equal(c)
            expect(OrmUtils.mergeDeep(b, a)).to.deep.equal(c)
            expect(OrmUtils.mergeDeep(b, a, a)).to.deep.equal(c)
            expect(OrmUtils.mergeDeep(a, b, a)).to.deep.equal(c)
            expect(OrmUtils.mergeDeep(a, a, b)).to.deep.equal(c)
            expect(OrmUtils.mergeDeep(b, a, b)).to.deep.equal(c)
        })

        it("should merge recursively deep objects correctly", () => {
            const a: Record<string, unknown> = {}
            const b: Record<string, unknown> = {}

            a["b"] = b
            a["a"] = a
            b["a"] = a

            expect(OrmUtils.mergeDeep({}, a))
        })

        it("should reference copy complex instances of classes.", () => {
            class Foo {
                recursive: Foo

                constructor() {
                    this.recursive = this
                }
            }

            const foo = new Foo()
            const result = OrmUtils.mergeDeep({}, { foo })
            expect(result).to.have.property("foo")
            expect(result.foo).to.equal(foo)
        })
    })

    describe("cloneObject", () => {
        it("should create a shallow copy of an instance without invoking the constructor", () => {
            class SomeClass {
                static hasConstructorBeenInvoked = false

                constructor(
                    public someString: string,
                    public someNumber: number,
                ) {
                    if (SomeClass.hasConstructorBeenInvoked) {
                        throw Error(
                            "The constructor was invoked a second time!",
                        )
                    }
                    SomeClass.hasConstructorBeenInvoked = true
                }

                clone() {
                    return new SomeClass(this.someString, this.someNumber)
                }
            }

            const obj = new SomeClass("string", 0)

            let objCopy: SomeClass | undefined
            let objCopy2: SomeClass | undefined
            expect(() => {
                objCopy = OrmUtils.cloneObject(obj)
            }).not.to.throw()
            expect(() => {
                objCopy2 = obj.clone()
            }).to.throw()
            expect(objCopy).not.to.equal(obj)
            expect(objCopy).to.deep.equal(obj)
            expect(objCopy2).to.equal(undefined)
        })
    })

    describe("getArraysDiff", () => {
        it("should return array difference", () => {
            const a = [1, 2, 3]
            const b = [2, 3, 4]

            expect(OrmUtils.getArraysDiff(a, b)).to.deep.equal({
                extraItems: [1],
                missingItems: [4],
            })
            expect(OrmUtils.getArraysDiff(b, a)).to.deep.equal({
                extraItems: [4],
                missingItems: [1],
            })
        })
    })

    describe("compare2Objects", () => {
        it("should compare two Map.", () => {
            expect(OrmUtils.deepCompare(new Map(), new Map())).to.equal(true)
            expect(
                OrmUtils.deepCompare(
                    new Map(
                        Object.entries({ prop1: "value1", prop2: "value2" }),
                    ),
                    new Map(
                        Object.entries({ prop1: "value1", prop2: "value2" }),
                    ),
                ),
            ).to.equal(true)
            expect(
                OrmUtils.deepCompare(
                    new Map(Object.entries({ prop1: "value1" })),
                    new Map(
                        Object.entries({ prop1: "value1", prop2: "value2" }),
                    ),
                ),
            ).to.equal(false)
        })

        it("should compare two Set.", () => {
            expect(OrmUtils.deepCompare(new Set(), new Set())).to.equal(true)
            expect(
                OrmUtils.deepCompare(new Set([1, 2, 3]), new Set([1, 2, 3])),
            ).to.equal(true)
            expect(
                OrmUtils.deepCompare(new Set([1, 2]), new Set([1, 2, 3])),
            ).to.equal(false)
        })
    })
})
