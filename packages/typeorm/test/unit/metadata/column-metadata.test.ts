import { expect } from "chai"
import { runInNewContext } from "node:vm"
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

        it("compares cross-realm Uint8Array values by content", () => {
            const context = {
                getEntityValue: () =>
                    runInNewContext("new Uint8Array([1, 2, 3])"),
            } as Pick<ColumnMetadata, "getEntityValue">

            expect(
                compareEntityValue.call(context, {}, new Uint8Array([1, 2, 3])),
            ).to.equal(true)
            expect(
                compareEntityValue.call(context, {}, new Uint8Array([1, 2, 4])),
            ).to.equal(false)
        })
    })

    describe("getEntityValueMap", () => {
        it("should return referenced entity value for single join column even when value is 0", () => {
            const referencedColumn = {
                getEntityValue: (entity: any) => entity?.id,
            } as ColumnMetadata

            const column = Object.create(
                ColumnMetadata.prototype,
            ) as ColumnMetadata
            Object.assign(column, {
                propertyName: "authorId",
                relationMetadata: {
                    isLazy: false,
                    propertyName: "author",
                    joinColumns: [{ referencedColumn }],
                },
            })

            const result = column.getEntityValueMap({ author: { id: 0 } })
            expect(result).to.deep.equal({ authorId: 0 })
        })

        it("should preserve bigint value as string for single join column with increment strategy", () => {
            const referencedColumn = {
                type: "bigint",
                generationStrategy: "increment",
                getEntityValue: (entity: any) => entity?.id,
            } as ColumnMetadata

            const column = Object.create(
                ColumnMetadata.prototype,
            ) as ColumnMetadata
            Object.assign(column, {
                propertyName: "sourceId",
                relationMetadata: {
                    isLazy: false,
                    propertyName: "product",
                    joinColumns: [{ referencedColumn }],
                },
            })

            const result = column.getEntityValueMap({
                product: { id: 9007199254740993n },
            })
            expect(result).to.deep.equal({ sourceId: "9007199254740993" })
        })
    })
})
