import { expect } from "chai"
import { runInNewContext } from "node:vm"
import {
    areUint8ArraysEqual,
    isUint8Array,
} from "../../../src/util/Uint8ArrayUtils"

describe("Uint8ArrayUtils", () => {
    describe("isUint8Array", () => {
        it("returns true for cross-realm Uint8Array values", () => {
            const crossRealmArray = runInNewContext("new Uint8Array([1, 2, 3])")
            expect(isUint8Array(crossRealmArray)).to.equal(true)
        })
    })

    describe("areUint8ArraysEqual", () => {
        it("returns true for the same reference", () => {
            const value = new Uint8Array([1, 2, 3])
            expect(areUint8ArraysEqual(value, value)).to.equal(true)
        })

        it("compares Buffer values by content", () => {
            const left = Buffer.from([1, 2, 3])
            const right = Buffer.from([1, 2, 3])
            const other = Buffer.from([1, 2, 4])

            expect(areUint8ArraysEqual(left, right)).to.equal(true)
            expect(areUint8ArraysEqual(left, other)).to.equal(false)
        })
    })
})
