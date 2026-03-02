import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Example } from "./entity/Example"
import { ExampleText } from "./entity/ExampleText"

describe("github issues > #7882  .findOne reduces relations to an empty array", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["better-sqlite3"],
            entities: [Example, ExampleText],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should delete all documents related to search pattern", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const relations = { exampleText: true }

                const repo = connection.getRepository(Example)

                await repo.find({ relations })

                expect(relations).to.be.eql({ exampleText: true })
            }),
        ))
})
