import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { Event } from "./entity/Event"
import { after, before } from "mocha"
import { expect } from "chai"

describe("github issues > #11515 DateUtils.mixedDateToDateString should support UTC", () => {
    let originalTZ: string | undefined
    let connections: DataSource[]

    before(async () => {
        originalTZ = process.env.TZ
        process.env.TZ = "America/New_York"
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })

    after(async () => {
        process.env.TZ = originalTZ
        await closeTestingConnections(connections)
    })
    beforeEach(() => reloadTestingDatabases(connections))

    it("should save the date column in UTC when the utc flag is true", () =>
        Promise.all(
            connections.map(async (connection) => {
                const event = new Event()
                const utc = new Date(Date.UTC(2025, 5, 1))

                event.localDate = utc
                event.utcDate = utc

                const saveEvent = await connection.manager.save(event)
                const result = await connection.manager.findOneBy(Event, {
                    id: saveEvent.id,
                })

                expect(result!.utcDate).to.equal("2025-06-01")
                expect(result!.localDate).to.equal("2025-05-31")
            }),
        ))
})
