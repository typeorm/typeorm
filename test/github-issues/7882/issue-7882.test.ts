import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Example } from "./entity/Example"
import { ExampleText } from "./entity/ExampleText"

describe("github issues > #7882  .findOne reduces relations to an empty array", () => {
    let connections: DataSource[]
    beforeAll(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["sqlite"],
            entities: [Example, ExampleText],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should delete all documents related to search pattern", () =>
        Promise.all(
            connections.map(async (connection) => {
                const relations = { exampleText: true }

                const repo = connection.getRepository(Example)

                await repo.find({ relations })

                expect(relations).to.be.eql({ exampleText: true })
            }),
        ))
})
