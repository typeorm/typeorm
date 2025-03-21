import { expect } from "chai"
import { OrmUtils } from "../../../src/util/OrmUtils"

describe("github issues > #10989 OrmUtils.deepCompare cannot compare Map objects", () => {
    it("should compare two Map.", () => {
        expect(OrmUtils.deepCompare(new Map(), new Map())).to.equal(true)
        expect(
            OrmUtils.deepCompare(
                new Map(Object.entries({ prop1: "value1", prop2: "value2" })),
                new Map(Object.entries({ prop1: "value1", prop2: "value2" })),
            ),
        ).to.equal(true)
        expect(
            OrmUtils.deepCompare(
                new Map(Object.entries({ prop1: "value1" })),
                new Map(Object.entries({ prop1: "value1", prop2: "value2" })),
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
