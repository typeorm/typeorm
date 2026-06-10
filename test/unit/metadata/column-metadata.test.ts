import { expect } from "chai"
import { runInNewContext } from "node:vm"
import { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"
import { ValueHandlers } from "../../../src/metadata/value-handlers/ValueHandlers"

describe("ColumnMetadata", () => {
    describe("compareEntityValue", () => {
        function createContext(
            getEntityValue: () => any,
        ): Pick<
            ColumnMetadata,
            "getEntityValue" | "valuesEqual" | "valueHandler" | "isArray"
        > {
            return {
                getEntityValue,
                valueHandler: ValueHandlers.defaultHandler,
                isArray: false,
                valuesEqual: ColumnMetadata.prototype.valuesEqual,
            }
        }

        // eslint-disable-next-line @typescript-eslint/unbound-method
        const compareEntityValue = ColumnMetadata.prototype.compareEntityValue

        it("compares Uint8Array values by content", () => {
            const context = createContext(() => new Uint8Array([1, 2, 3]))

            expect(
                compareEntityValue.call(context, {}, new Uint8Array([1, 2, 3])),
            ).to.equal(true)
            expect(
                compareEntityValue.call(context, {}, new Uint8Array([1, 2, 4])),
            ).to.equal(false)
        })

        it("compares Buffer and Uint8Array values by content", () => {
            const context = createContext(() => Buffer.from([1, 2, 3]))

            expect(
                compareEntityValue.call(context, {}, new Uint8Array([1, 2, 3])),
            ).to.equal(true)
            expect(
                compareEntityValue.call(context, {}, new Uint8Array([1, 2, 4])),
            ).to.equal(false)
        })

        it("compares cross-realm Uint8Array values by content", () => {
            const context = createContext(() =>
                runInNewContext("new Uint8Array([1, 2, 3])"),
            )

            expect(
                compareEntityValue.call(context, {}, new Uint8Array([1, 2, 3])),
            ).to.equal(true)
            expect(
                compareEntityValue.call(context, {}, new Uint8Array([1, 2, 4])),
            ).to.equal(false)
        })
    })
})
