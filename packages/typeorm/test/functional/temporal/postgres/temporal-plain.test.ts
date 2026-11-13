import "reflect-metadata"
import { expect } from "chai"
import { Temporal } from "@js-temporal/polyfill"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { PlainPost } from "./entity/PlainPost"

describe("temporal > Plain types", () => {
    let dataSources: DataSource[] = []
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [PlainPost],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => dataSources.length && reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("round-trips PlainDateTime, PlainDate, PlainTime", async () => {
        await Promise.all(
            dataSources.map(async (ds) => {
                const repo = ds.getRepository(PlainPost)
                const e = new PlainPost()
                e.happenedAt = Temporal.PlainDateTime.from(
                    "2026-05-07T12:34:56.789",
                )
                e.onDate = Temporal.PlainDate.from("2026-05-07")
                e.atTime = Temporal.PlainTime.from("12:34:56")
                const saved = await repo.save(e)
                const found = await repo.findOneByOrFail({ id: saved.id })
                expect(found.happenedAt).to.be.instanceOf(
                    Temporal.PlainDateTime,
                )
                expect(found.happenedAt.toString()).to.equal(
                    "2026-05-07T12:34:56.789",
                )
                expect(found.onDate).to.be.instanceOf(Temporal.PlainDate)
                expect(found.onDate.toString()).to.equal("2026-05-07")
                expect(found.atTime).to.be.instanceOf(Temporal.PlainTime)
                expect(found.atTime.toString()).to.equal("12:34:56")
            }),
        )
    })
})
