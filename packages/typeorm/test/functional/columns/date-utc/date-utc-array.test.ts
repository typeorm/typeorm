import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { EventWithDates } from "./entity/EventWithDates"
import type { DataSource } from "../../../../src"

describe("columns > date utc flag > array", () => {
    let originalTZ: string | undefined
    let dataSources: DataSource[]

    before(async () => {
        originalTZ = process.env.TZ
        process.env.TZ = "America/New_York"
        dataSources = await createTestingConnections({
            entities: [EventWithDates],
            enabledDrivers: ["postgres", "cockroachdb"],
        })
    })

    after(async () => {
        process.env.TZ = originalTZ
        await closeTestingConnections(dataSources)
    })

    beforeEach(() => reloadTestingDatabases(dataSources))

    it("should save an array of dates by its UTC day when the utc flag is true", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const event = new EventWithDates()
                event.utcDates = [new Date(Date.UTC(2025, 5, 1))] // 2025-06-01 in UTC

                const saved = await dataSource.manager.save(event)
                const result = await dataSource.manager.findOneByOrFail(
                    EventWithDates,
                    { id: saved.id },
                )

                const day = result.utcDates![0]
                // The stored day is the UTC one, whatever the process time zone
                expect([
                    day.getFullYear(),
                    day.getMonth() + 1,
                    day.getDate(),
                ]).to.eql([2025, 6, 1])
            }),
        ))
})
