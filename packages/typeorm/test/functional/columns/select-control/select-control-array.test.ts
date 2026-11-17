import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { DateUtils } from "../../../../src/util/DateUtils"
import { Schedule } from "./entity/Schedule"

describe("columns > select-control > date and time arrays", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Schedule],
            enabledDrivers: ["postgres", "cockroachdb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    function loadWithHiddenColumns(dataSource: DataSource, id: number) {
        return dataSource
            .getRepository(Schedule)
            .createQueryBuilder("schedule")
            .addSelect(["schedule.days", "schedule.hours", "schedule.moments"])
            .where("schedule.id = :id", { id })
            .getOneOrFail()
    }

    // GitHub issue #13071
    it("should save an entity loaded with select: false date, time and timestamp arrays", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Schedule)
                const { id } = await repository.save({
                    name: "before",
                    days: ["2026-01-05", "2026-01-06"],
                    hours: ["08:00:00", "17:30:00"],
                    moments: [new Date("2026-01-05T08:00:00.000Z")],
                })

                const schedule = await loadWithHiddenColumns(dataSource, id)
                schedule.name = "after"
                await repository.save(schedule)

                const reloaded = await loadWithHiddenColumns(dataSource, id)
                expect(reloaded.name).to.equal("after")
                expect(
                    reloaded.days?.map((day) =>
                        DateUtils.mixedDateToDateString(day),
                    ),
                ).to.deep.equal(["2026-01-05", "2026-01-06"])
                expect(reloaded.hours).to.deep.equal(["08:00:00", "17:30:00"])
                expect(reloaded.moments).to.have.length(1)
            }),
        ))

    it("should save a changed select: false date array", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Schedule)
                const { id } = await repository.save({
                    name: "schedule",
                    days: ["2026-01-05"],
                })

                const schedule = await loadWithHiddenColumns(dataSource, id)
                schedule.days = ["2026-02-02"]
                await repository.save(schedule)

                const reloaded = await loadWithHiddenColumns(dataSource, id)
                expect(
                    reloaded.days?.map((day) =>
                        DateUtils.mixedDateToDateString(day),
                    ),
                ).to.deep.equal(["2026-02-02"])
            }),
        ))
})
