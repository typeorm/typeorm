import { expect } from "chai"
import { OrmUtils } from "../../../src/util/OrmUtils"
import { TypeORMError } from "../../../src/error"
import { IsNull } from "../../../src/find-options/operator/IsNull"

describe("OrmUtils.normalizeWhereCriteria", () => {
    describe("when invalidWhereValuesBehavior is not configured (options === undefined)", () => {
        // Regression test for https://github.com/typeorm/typeorm/issues/12578
        // Previously `if (!options) return criteria` bypassed validation entirely,
        // so an undefined/null in the where criteria silently passed through
        // instead of throwing, contradicting the documented default.

        it("throws on an undefined property value by default", () => {
            expect(() =>
                OrmUtils.normalizeWhereCriteria({
                    id: 1,
                    name: undefined,
                }),
            ).to.throw(TypeORMError, /Undefined value encountered/)
        })

        it("throws on a null property value by default", () => {
            expect(() =>
                OrmUtils.normalizeWhereCriteria({
                    id: 1,
                    name: null,
                }),
            ).to.throw(TypeORMError, /Null value encountered/)
        })

        it("throws on undefined nested inside a plain object", () => {
            expect(() =>
                OrmUtils.normalizeWhereCriteria({
                    profile: { bio: undefined },
                }),
            ).to.throw(TypeORMError, /Undefined value encountered/)
        })

        it("throws on undefined inside an array of top-level criteria", () => {
            expect(() =>
                OrmUtils.normalizeWhereCriteria([
                    { id: 1 },
                    { id: undefined },
                ]),
            ).to.throw(TypeORMError, /Undefined value encountered/)
        })

        it("does not throw and passes through plain criteria with no null/undefined", () => {
            const result = OrmUtils.normalizeWhereCriteria({
                id: 1,
                name: "foo",
            })
            expect(result).to.deep.equal({ id: 1, name: "foo" })
        })
    })

    describe("when invalidWhereValuesBehavior is explicitly configured", () => {
        it("respects undefined: 'ignore' by omitting the key", () => {
            const result = OrmUtils.normalizeWhereCriteria(
                { id: 1, name: undefined },
                { undefined: "ignore" },
            )
            expect(result).to.deep.equal({ id: 1 })
        })

        it("respects null: 'ignore' by omitting the key", () => {
            const result = OrmUtils.normalizeWhereCriteria(
                { id: 1, name: null },
                { null: "ignore" },
            )
            expect(result).to.deep.equal({ id: 1 })
        })

        it("respects null: 'sql-null' by converting to IsNull()", () => {
            const result: any = OrmUtils.normalizeWhereCriteria(
                { id: 1, name: null },
                { null: "sql-null" },
            )
            expect(result.id).to.equal(1)
            expect(result.name).to.deep.equal(IsNull())
        })

        it("still throws on undefined when only 'null' behavior is configured", () => {
            expect(() =>
                OrmUtils.normalizeWhereCriteria(
                    { id: 1, name: undefined },
                    { null: "ignore" },
                ),
            ).to.throw(TypeORMError, /Undefined value encountered/)
        })

        it("still throws on null when only 'undefined' behavior is configured", () => {
            expect(() =>
                OrmUtils.normalizeWhereCriteria(
                    { id: 1, name: null },
                    { undefined: "ignore" },
                ),
            ).to.throw(TypeORMError, /Null value encountered/)
        })
    })

    describe("prototype pollution guard", () => {
        it("does not assign an own __proto__ key onto the result's prototype", () => {
            const malicious = JSON.parse(
                '{"id": 1, "__proto__": {"polluted": true}}',
            )

            const result: any = OrmUtils.normalizeWhereCriteria(malicious)

            expect(result.id).to.equal(1)
            expect(({} as any).polluted).to.be.undefined
            expect(Object.prototype.hasOwnProperty.call(result, "__proto__"))
                .to.be.false
        })
    })

    describe("empty nested objects", () => {
        it("omits a nested key whose entire contents were stripped via 'ignore'", () => {
            const result = OrmUtils.normalizeWhereCriteria(
                { profile: { bio: undefined } },
                { undefined: "ignore" },
            )
            expect(result).to.deep.equal({})
        })
    })
})
