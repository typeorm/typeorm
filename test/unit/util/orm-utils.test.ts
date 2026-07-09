import { expect } from "chai"
import { runInNewContext } from "node:vm"
import type { DeepPartial } from "../../../src"
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

        it("should compare cross-realm Uint8Array values by content", () => {
            const crossRealmArray = runInNewContext("new Uint8Array([1, 2, 3])")

            expect(
                OrmUtils.deepCompare(
                    crossRealmArray,
                    new Uint8Array([1, 2, 3]),
                ),
            ).to.equal(true)
            expect(
                OrmUtils.deepCompare(
                    crossRealmArray,
                    new Uint8Array([1, 2, 4]),
                ),
            ).to.equal(false)
        })
    })

    describe("normalizeWhereCriteria", () => {
        it("returns criteria unchanged when no options are provided", () => {
            const criteria = { name: null, email: undefined }
            expect(OrmUtils.normalizeWhereCriteria(criteria)).to.equal(criteria)
        })

        it("throws on null/undefined by default when options are provided", () => {
            expect(() =>
                OrmUtils.normalizeWhereCriteria({ name: undefined }, {}),
            ).to.throw(/Undefined value.*'name'/)
            expect(() =>
                OrmUtils.normalizeWhereCriteria({ email: null }, {}),
            ).to.throw(/Null value.*'email'/)
        })

        it("honors 'ignore' by stripping null/undefined keys", () => {
            const result = OrmUtils.normalizeWhereCriteria(
                { name: "Alice", email: null, phone: undefined },
                { null: "ignore", undefined: "ignore" },
            )
            expect(result).to.deep.equal({ name: "Alice" })
        })

        it("passes entity class instances through unchanged (only plain objects are normalized)", () => {
            class User {
                id = 1
                name = "Alice"
                parentId: number | null = null
            }
            const entity = new User()
            // an entity instance is not a plain object, so it is returned
            // untouched — its null column is not validated/stripped even under
            // "throw" (proper handling would need entity metadata)
            expect(
                OrmUtils.normalizeWhereCriteria(entity, { null: "throw" }),
            ).to.equal(entity)
        })

        it("passes primitives and atomic value-types (Date, Uint8Array) through unchanged", () => {
            const date = new Date()
            const bytes = new Uint8Array([1, 2, 3])
            expect(
                OrmUtils.normalizeWhereCriteria(date as any, { null: "throw" }),
            ).to.equal(date)
            expect(
                OrmUtils.normalizeWhereCriteria(bytes as any, {
                    null: "throw",
                }),
            ).to.equal(bytes)
            expect(
                OrmUtils.normalizeWhereCriteria(5 as any, { null: "throw" }),
            ).to.equal(5)
        })

        it("ignores the __proto__ key when iterating", () => {
            const result = OrmUtils.normalizeWhereCriteria(
                JSON.parse('{ "__proto__": { "polluted": true }, "id": 1 }'),
                {},
            ) as Record<string, unknown>
            expect(result).to.deep.equal({ id: 1 })
            // the guard must prevent a `result["__proto__"] = ...` assignment from
            // re-pointing the returned object's prototype (per-object pollution),
            // not just global Object.prototype pollution.
            expect(Object.getPrototypeOf(result)).to.equal(Object.prototype)
            expect(result.polluted).to.equal(undefined)
            expect(({} as any).polluted).to.equal(undefined)
        })
    })

    describe("isCriteriaNullOrEmpty", () => {
        it("treats null/undefined/empty-string as empty", () => {
            expect(OrmUtils.isCriteriaNullOrEmpty(null)).to.equal(true)
            expect(OrmUtils.isCriteriaNullOrEmpty(undefined)).to.equal(true)
            expect(OrmUtils.isCriteriaNullOrEmpty("")).to.equal(true)
        })

        it("treats a non-empty primitive as not empty", () => {
            expect(OrmUtils.isCriteriaNullOrEmpty(1)).to.equal(false)
            expect(OrmUtils.isCriteriaNullOrEmpty("id")).to.equal(false)
        })

        it("treats an empty plain object as empty", () => {
            expect(OrmUtils.isCriteriaNullOrEmpty({})).to.equal(true)
        })

        it("treats a non-empty plain object as not empty", () => {
            expect(OrmUtils.isCriteriaNullOrEmpty({ id: 1 })).to.equal(false)
        })

        it("treats an empty array as empty", () => {
            expect(OrmUtils.isCriteriaNullOrEmpty([])).to.equal(true)
        })

        it("only checks whole emptiness, not per-element emptiness", () => {
            // isCriteriaNullOrEmpty is deliberately shallow: a non-empty array
            // is not empty regardless of its elements. Per-element OR-branch
            // emptiness (e.g. [{}] / [[]]) is enforced where object criteria is
            // validated (EntityManager.normalizeAndValidateWhereCriteria), not
            // here — this keeps it usable for primitive id-arrays and cheap.
            expect(OrmUtils.isCriteriaNullOrEmpty([{}])).to.equal(false)
            expect(OrmUtils.isCriteriaNullOrEmpty([[]])).to.equal(false)
            expect(OrmUtils.isCriteriaNullOrEmpty([{ id: 1 }])).to.equal(false)
            expect(OrmUtils.isCriteriaNullOrEmpty([1, 2, 3])).to.equal(false)
            // a populated primitive id-list containing "" is NOT empty
            expect(OrmUtils.isCriteriaNullOrEmpty(["a", "", "c"])).to.equal(
                false,
            )
        })

        it("does not recurse on a self-referential array", () => {
            const cyclic: any[] = []
            cyclic.push(cyclic)
            // shallow check — must not throw a RangeError and a non-empty
            // (self-referential) array is not treated as empty
            expect(OrmUtils.isCriteriaNullOrEmpty(cyclic)).to.equal(false)
        })
    })
})
