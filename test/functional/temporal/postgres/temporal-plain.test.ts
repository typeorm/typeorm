import "reflect-metadata"
import { expect } from "chai"
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
        if (typeof (globalThis as any).Temporal === "undefined") return
        dataSources = await createTestingConnections({
            entities: [PlainPost],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => dataSources.length && reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("round-trips PlainDateTime, PlainDate, PlainTime", async function () {
        if (typeof (globalThis as any).Temporal === "undefined") this.skip()
        const T = (globalThis as any).Temporal
        await Promise.all(
            dataSources.map(async (ds) => {
                const repo = ds.getRepository(PlainPost)
                const e = new PlainPost()
                e.happenedAt = T.PlainDateTime.from("2026-05-07T12:34:56.789")
                e.onDate = T.PlainDate.from("2026-05-07")
                e.atTime = T.PlainTime.from("12:34:56")
                const saved = await repo.save(e)
                const found = await repo.findOneByOrFail({ id: saved.id })
                expect(found.happenedAt).to.be.instanceOf(T.PlainDateTime)
                expect(found.happenedAt.toString()).to.equal(
                    "2026-05-07T12:34:56.789",
                )
                expect(found.onDate).to.be.instanceOf(T.PlainDate)
                expect(found.onDate.toString()).to.equal("2026-05-07")
                expect(found.atTime).to.be.instanceOf(T.PlainTime)
                expect(found.atTime.toString()).to.equal("12:34:56")
            }),
        )
    })
})
