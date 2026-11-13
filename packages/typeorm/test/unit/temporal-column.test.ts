import "reflect-metadata"
import { expect } from "chai"
import { Temporal } from "@js-temporal/polyfill"
import { Column } from "../../src/decorator/columns/Column"
import { Entity } from "../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../src/decorator/columns/PrimaryGeneratedColumn"
import { getMetadataArgsStorage } from "../../src/globals"
import type { ColumnOptions } from "../../src/decorator/options/ColumnOptions"

function declareTemporalColumn(
    designType: unknown,
    options?: ColumnOptions,
): Function {
    class C {}
    Reflect.defineMetadata("design:type", designType, C.prototype, "value")
    if (options) Column(options)(C.prototype, "value")
    else Column()(C.prototype, "value")
    PrimaryGeneratedColumn()(C.prototype, "id")
    Entity()(C)
    return C
}

function columnArgsFor(target: Function, propertyName: string) {
    return getMetadataArgsStorage().columns.find(
        (c) => c.target === target && c.propertyName === propertyName,
    )
}

describe("@Column Temporal inference", () => {
    it("infers each Temporal kind without explicit type", () => {
        const cases: [unknown, string][] = [
            [Temporal.PlainDate, "PlainDate"],
            [Temporal.PlainTime, "PlainTime"],
            [Temporal.PlainDateTime, "PlainDateTime"],
            [Temporal.ZonedDateTime, "ZonedDateTime"],
            [Temporal.Duration, "Duration"],
        ]
        for (const [designType, label] of cases) {
            const C = declareTemporalColumn(designType)
            const args = columnArgsFor(C, "value")
            expect(args, label).to.exist
            expect(args!.options.temporal, label).to.equal(true)
            // The Temporal class stays in `options.type`; each driver's
            // `normalizeType` translates it per-DB.
            expect(args!.options.type, label).to.equal(designType)
        }
    })

    it("leaves non-Temporal reflect types untouched (no temporal opt-in)", () => {
        const C = declareTemporalColumn(String)
        const args = columnArgsFor(C, "value")
        expect(args!.options.temporal).to.equal(undefined)
        expect(args!.options.type).to.equal(String)
    })

    it("respects explicit `temporal: false` to opt out of auto-inference", () => {
        const C = declareTemporalColumn(Temporal.PlainDateTime, {
            type: "varchar",
            temporal: false,
        })
        const args = columnArgsFor(C, "value")
        expect(args!.options.temporal).to.equal(false)
        expect(args!.options.type).to.equal("varchar")
    })

    it("preserves user-specified `temporal: { timeZone }` for ZonedDateTime", () => {
        const C = declareTemporalColumn(Temporal.ZonedDateTime, {
            temporal: { timeZone: "Asia/Seoul" },
        })
        const args = columnArgsFor(C, "value")
        expect(args!.options.temporal).to.deep.equal({ timeZone: "Asia/Seoul" })
        expect(args!.options.type).to.equal(Temporal.ZonedDateTime)
    })
})
