import "reflect-metadata"
import { expect } from "chai"
import { EntityMetadataValidator } from "../../../src/metadata-builder/EntityMetadataValidator"
import type { EntityMetadata } from "../../../src/metadata/EntityMetadata"
import type { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"

function makeColumn(opts: {
    propertyName: string
    type: string
    temporal: any
}): ColumnMetadata {
    return {
        propertyName: opts.propertyName,
        type: opts.type,
        temporal: opts.temporal,
    } as unknown as ColumnMetadata
}

function makeEntity(
    columns: ColumnMetadata[],
    name = "TestEntity",
    primaryColumns: ColumnMetadata[] = [],
): EntityMetadata {
    return {
        name,
        columns,
        primaryColumns,
    } as unknown as EntityMetadata
}

describe("EntityMetadataValidator > Temporal", () => {
    const validator = new EntityMetadataValidator()
    const supported = typeof (globalThis as any).Temporal !== "undefined"

    it("noop for temporal: false and undefined", function () {
        const e = makeEntity([
            makeColumn({
                propertyName: "a",
                type: "timestamptz",
                temporal: false,
            }),
            makeColumn({
                propertyName: "b",
                type: "timestamptz",
                temporal: undefined,
            }),
        ])
        expect(() =>
            (validator as any).validateTemporalColumns(e),
        ).not.to.throw()
    })

    it("accepts any column shape when Temporal is supported (no DB↔option matching)", function () {
        if (!supported) this.skip()
        const e = makeEntity([
            makeColumn({
                propertyName: "a",
                type: "timestamptz",
                temporal: true,
            }),
            makeColumn({
                propertyName: "b",
                type: "timestamptz",
                temporal: { timeZone: "Asia/Seoul" },
            }),
            makeColumn({
                propertyName: "c",
                type: "varchar",
                temporal: true,
            }),
            makeColumn({
                propertyName: "d",
                type: "date",
                temporal: { timeZone: "UTC" },
            }),
        ])
        expect(() =>
            (validator as any).validateTemporalColumns(e),
        ).not.to.throw()
    })

    it("rejects temporal usage when Temporal API is missing", function () {
        if (!supported) this.skip()
        const original = (globalThis as any).Temporal
        ;(globalThis as any).Temporal = undefined
        try {
            const e = makeEntity([
                makeColumn({
                    propertyName: "v",
                    type: "timestamptz",
                    temporal: true,
                }),
            ])
            expect(() =>
                (validator as any).validateTemporalColumns(e),
            ).to.throw(/Temporal.*not.*available/i)
        } finally {
            ;(globalThis as any).Temporal = original
        }
    })
})
