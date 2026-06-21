import { expect } from "chai"
import { OrmUtils } from "../../../src/util/OrmUtils"
import { TypeORMError } from "../../../src/error/TypeORMError"

describe("OrmUtils.normalizeWhereCriteria > default behavior", () => {
    describe("when options is undefined (not provided)", () => {
        it("should throw error for null values by default", () => {
            const criteria = { name: null }

            expect(() => {
                OrmUtils.normalizeWhereCriteria(criteria)
            }).to.throw(TypeORMError)
        })

        it("should throw error for undefined values by default", () => {
            const criteria = { name: undefined }

            expect(() => {
                OrmUtils.normalizeWhereCriteria(criteria)
            }).to.throw(TypeORMError)
        })

        it("should throw error for nested null values by default", () => {
            const criteria = { user: { name: null } }

            expect(() => {
                OrmUtils.normalizeWhereCriteria(criteria)
            }).to.throw(TypeORMError)
        })

        it("should throw error for nested undefined values by default", () => {
            const criteria = { user: { name: undefined } }

            expect(() => {
                OrmUtils.normalizeWhereCriteria(criteria)
            }).to.throw(TypeORMError)
        })

        it("should return criteria without null/undefined values", () => {
            const criteria = { name: "test", id: 1 }

            const result = OrmUtils.normalizeWhereCriteria(criteria)

            expect(result).to.deep.equal({ name: "test", id: 1 })
        })
    })

    describe("when options is empty object", () => {
        it("should use default throw behavior for null", () => {
            const criteria = { name: null }

            expect(() => {
                OrmUtils.normalizeWhereCriteria(criteria, {})
            }).to.throw(TypeORMError)
        })

        it("should use default throw behavior for undefined", () => {
            const criteria = { name: undefined }

            expect(() => {
                OrmUtils.normalizeWhereCriteria(criteria, {})
            }).to.throw(TypeORMError)
        })
    })

    describe("when explicit options are provided", () => {
        it("should respect ignore option for null", () => {
            const criteria = { name: null, id: 1 }

            const result = OrmUtils.normalizeWhereCriteria(criteria, {
                null: "ignore",
            })

            expect(result).to.deep.equal({ id: 1 })
        })

        it("should respect ignore option for undefined", () => {
            const criteria = { name: undefined, id: 1 }

            const result = OrmUtils.normalizeWhereCriteria(criteria, {
                undefined: "ignore",
            })

            expect(result).to.deep.equal({ id: 1 })
        })
    })
})
