import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"
import { Test } from "./entity/Test"

describe("query builder > exists", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Test],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("Exists query of empty table should be false", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const repo = connection.getRepository(Test)

                const exists = await repo.exists()
                expect(exists).to.be.equal(false)
            }),
        ))

    it("Exists query of non empty table should be true", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const repo = connection.getRepository(Test)

                await repo.save({ id: "ok" })
                await repo.save({ id: "nok" })

                const exists = await repo.exists()
                expect(exists).to.be.equal(true)
            }),
        ))
})
