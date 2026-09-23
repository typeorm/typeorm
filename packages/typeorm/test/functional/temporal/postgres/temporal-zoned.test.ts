import "reflect-metadata"
import { expect } from "chai"
import { Temporal } from "@js-temporal/polyfill"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { ZonedPost } from "./entity/ZonedPost"

describe("temporal > ZonedDateTime", () => {
    let dataSources: DataSource[] = []
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [ZonedPost],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => dataSources.length && reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("hydrates as ZonedDateTime in configured timeZone", async () => {
        await Promise.all(
            dataSources.map(async (ds) => {
                const repo = ds.getRepository(ZonedPost)
                const e = new ZonedPost()
                e.scheduledAt = Temporal.Instant.from(
                    "2026-05-07T03:00:00Z",
                ).toZonedDateTimeISO("Asia/Seoul")
                const saved = await repo.save(e)
                const found = await repo.findOneByOrFail({ id: saved.id })
                expect(found.scheduledAt).to.be.instanceOf(
                    Temporal.ZonedDateTime,
                )
                expect(found.scheduledAt.timeZoneId).to.equal("Asia/Seoul")
                expect(
                    found.scheduledAt.toInstant().epochMilliseconds,
                ).to.equal(e.scheduledAt.toInstant().epochMilliseconds)
            }),
        )
    })
})
