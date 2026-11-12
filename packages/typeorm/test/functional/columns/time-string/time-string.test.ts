import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Shift } from "./entity/Shift"
import type { DataSource } from "../../../../src"

describe("columns > time string", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Shift],
            enabledDrivers: ["mssql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // https://github.com/typeorm/typeorm/issues/10402
    it("should persist the exact time given as a string", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Shift)
                const withoutSeconds = await repository.save({
                    startsAt: "08:30",
                })
                const withSeconds = await repository.save({
                    startsAt: "08:30:00",
                })
                const withFraction = await repository.save({
                    startsAt: "08:30:15.250",
                })

                const loaded = await repository.findOneByOrFail({
                    id: withoutSeconds.id,
                })
                expect(loaded.startsAt).to.equal("08:30:00")

                const rows: { id: number; startsAt: string }[] =
                    await dataSource.query(
                        `SELECT "id", CAST("startsAt" AS varchar(16)) AS "startsAt" FROM "shift" ORDER BY "id"`,
                    )
                expect(rows).to.deep.equal([
                    { id: withoutSeconds.id, startsAt: "08:30:00.0000000" },
                    { id: withSeconds.id, startsAt: "08:30:00.0000000" },
                    { id: withFraction.id, startsAt: "08:30:15.2500000" },
                ])
            }),
        ))
})
