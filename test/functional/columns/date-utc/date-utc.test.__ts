import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Event } from "./entity/Event"
import { DataSource } from "../../../../src"

describe("columns > date utc flag", () => {
    let originalTZ: string | undefined
    let connections: DataSource[]

    before(async () => {
        originalTZ = process.env.TZ
        process.env.TZ = "America/New_York"
        connections = await createTestingConnections({
            entities: [Event],
        })
    })

    after(async () => {
        process.env.TZ = originalTZ
        await closeTestingConnections(connections)
    })

    beforeEach(() => reloadTestingDatabases(connections))

    it("should save date columns in UTC when utc flag is true and in local timezone when false", () =>
        Promise.all(
            connections.map(async (connection) => {
                const event = new Event()
                const testDate = new Date(Date.UTC(2025, 5, 1)) // 2025-06-01 in UTC

                event.localDate = testDate
                event.utcDate = testDate

                const savedEvent = await connection.manager.save(event)
                const result = await connection.manager.findOneBy(Event, {
                    id: savedEvent.id,
                })

                // UTC flag true: should save as 2025-06-01 (UTC date)
                expect(result!.utcDate).to.equal("2025-06-01")
                // UTC flag false (default): should save as 2025-05-31 (local timezone)
                expect(result!.localDate).to.equal("2025-05-31")
            }),
        ))
})
