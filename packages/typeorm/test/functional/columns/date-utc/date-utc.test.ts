import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Event } from "./entity/Event"
import type { DataSource } from "../../../../src"

describe("columns > date utc flag", () => {
    let originalTZ: string | undefined
    let dataSources: DataSource[]

    before(async () => {
        originalTZ = process.env.TZ
        process.env.TZ = "America/New_York"
        dataSources = await createTestingConnections({
            entities: [Event],
        })
    })

    after(async () => {
        process.env.TZ = originalTZ
        await closeTestingConnections(dataSources)
    })

    beforeEach(() => reloadTestingDatabases(dataSources))

    it("should save date columns in UTC when utc flag is true and in local timezone when false", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const event = new Event()
                const testDate = new Date(Date.UTC(2025, 5, 1)) // 2025-06-01 in UTC

                event.localDate = testDate
                event.utcDate = testDate

                const savedEvent = await dataSource.manager.save(event)
                const result = await dataSource.manager.findOneByOrFail(Event, {
                    id: savedEvent.id,
                })

                // UTC flag true: should save as 2025-06-01 (UTC date)
                expect(result.utcDate).to.equal("2025-06-01")
                // UTC flag false (default): should save as 2025-05-31 (local timezone)
                expect(result.localDate).to.equal("2025-05-31")
            }),
        ))

    // https://github.com/typeorm/typeorm/issues/12945
    it("should save a changed date by the day of the column's own time zone", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Event)
                const event = new Event()
                event.localDate = new Date(2025, 4, 31)
                event.utcDate = new Date(Date.UTC(2025, 4, 31))
                await repository.save(event)

                const loaded = await repository.findOneByOrFail({
                    id: event.id,
                })
                // next day in UTC, still May 31 in New York
                loaded.utcDate = new Date(Date.UTC(2025, 5, 1))
                // previous day in New York, already May 31 in UTC
                loaded.localDate = new Date(2025, 4, 30, 22)
                await repository.save(loaded)

                const result = await repository.findOneByOrFail({
                    id: event.id,
                })
                expect(result.utcDate).to.equal("2025-06-01")
                expect(result.localDate).to.equal("2025-05-30")
            }),
        ))

    // https://github.com/typeorm/typeorm/issues/12945
    it("should not update an unchanged utc date read through a transformer", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Event)
                const event = new Event()
                event.localDate = new Date(2025, 5, 1)
                event.utcDate = new Date(Date.UTC(2025, 5, 1))
                event.utcTransformedDate = new Date(Date.UTC(2025, 5, 1))
                await repository.save(event)

                const loaded = await repository.findOneByOrFail({
                    id: event.id,
                })
                await repository.save(loaded)

                const result = await repository.findOneByOrFail({
                    id: event.id,
                })
                expect(result.version).to.equal(1)
            }),
        ))
})
