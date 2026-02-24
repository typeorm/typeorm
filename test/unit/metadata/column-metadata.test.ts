import { expect } from "chai"
import { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"

describe("ColumnMetadata", () => {
    describe("compareEntityValue", () => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        const compareEntityValue = ColumnMetadata.prototype.compareEntityValue

        it("compares Uint8Array values by content", () => {
            const context = {
                getEntityValue: () => new Uint8Array([1, 2, 3]),
            } as Pick<ColumnMetadata, "getEntityValue">

            expect(
                compareEntityValue.call(context, {}, new Uint8Array([1, 2, 3])),
            ).to.equal(true)
            expect(
                compareEntityValue.call(context, {}, new Uint8Array([1, 2, 4])),
            ).to.equal(false)
        })

        it("compares Buffer and Uint8Array values by content", () => {
            const context = {
                getEntityValue: () => Buffer.from([1, 2, 3]),
            } as Pick<ColumnMetadata, "getEntityValue">

            expect(
                compareEntityValue.call(context, {}, new Uint8Array([1, 2, 3])),
            ).to.equal(true)
            expect(
                compareEntityValue.call(context, {}, new Uint8Array([1, 2, 4])),
            ).to.equal(false)
        })
    })
})
