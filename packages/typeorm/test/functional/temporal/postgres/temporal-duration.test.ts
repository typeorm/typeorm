import "reflect-metadata"
import { expect } from "chai"
import { Temporal } from "@js-temporal/polyfill"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DurationPost } from "./entity/DurationPost"

describe("temporal > Duration", () => {
    let dataSources: DataSource[] = []
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [DurationPost],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => dataSources.length && reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("round-trips Temporal.Duration via Postgres interval", async () => {
        await Promise.all(
            dataSources.map(async (ds) => {
                const repo = ds.getRepository(DurationPost)
                const e = new DurationPost()
                e.span = Temporal.Duration.from({
                    years: 1,
                    months: 2,
                    days: 3,
                    hours: 4,
                    minutes: 5,
                    seconds: 6,
                })
                const saved = await repo.save(e)
                const found = await repo.findOneByOrFail({ id: saved.id })
                expect(found.span).to.be.instanceOf(Temporal.Duration)
                expect(found.span.years).to.equal(1)
                expect(found.span.months).to.equal(2)
                expect(found.span.days).to.equal(3)
                expect(found.span.hours).to.equal(4)
                expect(found.span.minutes).to.equal(5)
                expect(found.span.seconds).to.equal(6)
                expect(found.span.milliseconds).to.equal(0)
            }),
        )
    })
})
