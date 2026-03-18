import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"
import { Test } from "./entity/Test"

describe("query builder > exists", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [Test],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("Exists query of empty table should be false", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(Test)

                const exists = await repo.exists()
                expect(exists).to.be.equal(false)
            }),
        ))

    it("Exists query of non empty table should be true", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(Test)

                await repo.save({ id: "ok" })
                await repo.save({ id: "nok" })

                const exists = await repo.exists()
                expect(exists).to.be.equal(true)
            }),
        ))
})
