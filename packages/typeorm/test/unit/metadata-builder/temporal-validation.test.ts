import "reflect-metadata"
import { expect } from "chai"
import { Temporal } from "@js-temporal/polyfill"
import { EntityMetadataValidator } from "../../../src/metadata-builder/EntityMetadataValidator"
import type { EntityMetadata } from "../../../src/metadata/EntityMetadata"
import type { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"
import type { Driver } from "../../../src/driver/Driver"

function makeColumn(opts: {
    propertyName: string
    type: string
    temporal: unknown
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

function makeDriver(temporal?: unknown): Driver {
    return { options: { temporal } } as unknown as Driver
}

describe("EntityMetadataValidator > Temporal", () => {
    const validator = new EntityMetadataValidator()
    const validateTemporal = (
        e: EntityMetadata,
        driver: Driver = makeDriver(),
    ) =>
        (
            validator as unknown as { validateTemporalColumns: Function }
        ).validateTemporalColumns(e, driver)

    it("noop for temporal: false and undefined", () => {
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
        // No Temporal implementation available, but no column opted in either.
        expect(() => validateTemporal(e, makeDriver(undefined))).not.to.throw()
    })

    it("accepts any column shape when Temporal is available (no DB↔option matching)", () => {
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
        expect(() => validateTemporal(e)).not.to.throw()
    })

    it("accepts DataSource-injected Temporal even when globalThis is missing", () => {
        const original = (globalThis as { Temporal?: unknown }).Temporal
        ;(globalThis as { Temporal?: unknown }).Temporal = undefined
        try {
            const e = makeEntity([
                makeColumn({
                    propertyName: "v",
                    type: "timestamptz",
                    temporal: true,
                }),
            ])
            expect(() =>
                validateTemporal(e, makeDriver(Temporal)),
            ).not.to.throw()
        } finally {
            ;(globalThis as { Temporal?: unknown }).Temporal = original
        }
    })

    it("rejects temporal usage when no implementation is available", () => {
        const original = (globalThis as { Temporal?: unknown }).Temporal
        ;(globalThis as { Temporal?: unknown }).Temporal = undefined
        try {
            const e = makeEntity([
                makeColumn({
                    propertyName: "v",
                    type: "timestamptz",
                    temporal: true,
                }),
            ])
            expect(() => validateTemporal(e, makeDriver(undefined))).to.throw(
                /Temporal/i,
            )
        } finally {
            ;(globalThis as { Temporal?: unknown }).Temporal = original
        }
    })
})
