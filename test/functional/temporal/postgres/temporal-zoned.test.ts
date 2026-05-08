import "reflect-metadata"
import { expect } from "chai"
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
        if (typeof (globalThis as any).Temporal === "undefined") return
        dataSources = await createTestingConnections({
            entities: [ZonedPost],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => dataSources.length && reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("hydrates as ZonedDateTime in configured timeZone", async function () {
        if (typeof (globalThis as any).Temporal === "undefined") this.skip()
        const T = (globalThis as any).Temporal
        await Promise.all(
            dataSources.map(async (ds) => {
                const repo = ds.getRepository(ZonedPost)
                const e = new ZonedPost()
                e.scheduledAt = T.Instant.from(
                    "2026-05-07T03:00:00Z",
                ).toZonedDateTimeISO("Asia/Seoul")
                const saved = await repo.save(e)
                const found = await repo.findOneByOrFail({ id: saved.id })
                expect(found.scheduledAt).to.be.instanceOf(T.ZonedDateTime)
                expect(found.scheduledAt.timeZoneId).to.equal("Asia/Seoul")
                expect(
                    found.scheduledAt.toInstant().epochMilliseconds,
                ).to.equal(e.scheduledAt.toInstant().epochMilliseconds)
            }),
        )
    })
})
