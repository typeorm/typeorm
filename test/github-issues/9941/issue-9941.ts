import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { A } from "./entity/A"

describe("github issues > #9941 ISO DateTime parsing returning wrong Date value", () => {
    let tzBefore: string | undefined = undefined
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => {
        // Mock timezones.
        tzBefore = process.env.TZ
        process.env.TZ = "America/Montreal"
        return reloadTestingDatabases(dataSources)
    })
    afterEach(() => {
        // Reset date timezone mock.
        if (tzBefore === undefined) {
            delete process.env.TZ
        } else {
            process.env.TZ = tzBefore
        }
    })
    after(() => {
        closeTestingConnections(dataSources)
    })

    it("should parse and save ISO date-time strings with given zero timezone offset (UTC) correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const entityManager = dataSource.createEntityManager()

                const dateString = "2023-05-02T01:01:01.000Z"
                const dateStringExpected = "2023-05-02T01:01:01.000Z"
                const savedA = await entityManager.save(
                    entityManager.create(A, { date: dateString }),
                )
                const fetchedA = (
                    await entityManager.find(A, { where: { id: savedA.id } })
                )[0]
                expect(fetchedA.date.toISOString()).eq(dateStringExpected)
            }),
        ))

    it("should parse and save ISO date strings without given time(-zone) correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const entityManager = dataSource.createEntityManager()

                // This should be parsed as local time (with 2h offset because mocking the timezone).
                const dateString = "2023-05-02"
                const dateStringExpected = "2023-05-02T04:00:00.000Z"
                const savedA = await entityManager.save(
                    entityManager.create(A, { date: dateString }),
                )
                const fetchedA = (
                    await entityManager.find(A, { where: { id: savedA.id } })
                )[0]
                expect(fetchedA.date.toISOString()).eq(dateStringExpected)
            }),
        ))

    it("should parse and save ISO date-time strings with non-zero timezone correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const entityManager = dataSource.createEntityManager()
                // With some offset.
                const dateString = "2023-05-02T07:01:01+06:30"
                let dateStringExpected = "2023-05-02T00:31:01.000Z"
                const savedA = await entityManager.save(
                    entityManager.create(A, { date: dateString }),
                )
                const fetchedA = (
                    await entityManager.find(A, { where: { id: savedA.id } })
                )[0]
                expect(fetchedA.date.toISOString()).eq(dateStringExpected)
            }),
        ))
})
