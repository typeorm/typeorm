import "reflect-metadata"
import { expect } from "chai"
import { OrmUtils } from "../../../../src/util/OrmUtils"

describe("normalizeWhereCriteria default behavior (issue #12578)", () => {
    it("should throw on undefined value when no options are provided", () => {
        expect(() => OrmUtils.normalizeWhereCriteria({ id: undefined }))
            .to.throw(/Undefined value encountered/)
    })

    it("should throw on null value when no options are provided", () => {
        expect(() => OrmUtils.normalizeWhereCriteria({ id: null }))
            .to.throw(/Null value encountered/)
    })

    it("should throw on nested undefined value when no options are provided", () => {
        expect(() => OrmUtils.normalizeWhereCriteria({ user: { id: undefined } }))
            .to.throw(/Undefined value encountered/)
    })

    it("should throw on nested null value when no options are provided", () => {
        expect(() => OrmUtils.normalizeWhereCriteria({ user: { id: null } }))
            .to.throw(/Null value encountered/)
    })

    it("should pass through valid criteria when no options are provided", () => {
        const result = OrmUtils.normalizeWhereCriteria({ id: 1, name: "test" }) as any
        expect(result).to.deep.equal({ id: 1, name: "test" })
    })

    it("should respect explicit ignore option for undefined", () => {
        const result = OrmUtils.normalizeWhereCriteria(
            { id: 1, name: undefined },
            { undefined: "ignore", null: "throw" }
        ) as any
        expect(result).to.deep.equal({ id: 1 })
    })
})
