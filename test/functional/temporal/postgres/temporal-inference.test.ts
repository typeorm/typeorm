import "reflect-metadata"
import { expect } from "chai"
import { Temporal } from "@js-temporal/polyfill"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src"

let InferredPost: Function

describe("temporal > reflect-metadata inference", () => {
    let dataSources: DataSource[] = []
    before(async () => {
        class _InferredPost {
            id!: number
            onDate!: Temporal.PlainDate
            atTime!: Temporal.PlainTime
            happenedAt!: Temporal.PlainDateTime
            scheduledAt!: Temporal.ZonedDateTime
            span!: Temporal.Duration
        }
        const reflectPairs: [Function, string][] = [
            [Temporal.PlainDate, "onDate"],
            [Temporal.PlainTime, "atTime"],
            [Temporal.PlainDateTime, "happenedAt"],
            [Temporal.ZonedDateTime, "scheduledAt"],
            [Temporal.Duration, "span"],
        ]
        for (const [designType, prop] of reflectPairs) {
            Reflect.defineMetadata(
                "design:type",
                designType,
                _InferredPost.prototype,
                prop,
            )
        }
        // Apply decorators manually (in the order TS would).
        PrimaryGeneratedColumn()(_InferredPost.prototype, "id")
        for (const [, prop] of reflectPairs)
            Column()(_InferredPost.prototype, prop)
        Entity()(_InferredPost)
        InferredPost = _InferredPost

        dataSources = await createTestingConnections({
            entities: [InferredPost],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => dataSources.length && reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("infers temporal kind and SQL type from design:type", async () => {
        await Promise.all(
            dataSources.map(async (ds) => {
                const repo = ds.getRepository(InferredPost as never)
                const e = new (InferredPost as { new (): any })()
                e.onDate = Temporal.PlainDate.from("2026-05-07")
                e.atTime = Temporal.PlainTime.from("12:34:56")
                e.happenedAt = Temporal.PlainDateTime.from(
                    "2026-05-07T12:34:56",
                )
                e.scheduledAt = Temporal.Instant.from(
                    "2026-05-07T03:00:00Z",
                ).toZonedDateTimeISO("UTC")
                e.span = Temporal.Duration.from("P1Y2M3D")
                const saved = await repo.save(e)
                const found = await repo.findOneByOrFail({ id: saved.id })
                expect(found.onDate).to.be.instanceOf(Temporal.PlainDate)
                expect(found.atTime).to.be.instanceOf(Temporal.PlainTime)
                expect(found.happenedAt).to.be.instanceOf(
                    Temporal.PlainDateTime,
                )
                expect(found.scheduledAt).to.be.instanceOf(
                    Temporal.ZonedDateTime,
                )
                expect(found.span).to.be.instanceOf(Temporal.Duration)
            }),
        )
    })
})
