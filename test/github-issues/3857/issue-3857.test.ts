import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Men } from "./entity/Men"
import { Person } from "./entity/Person"
import { Women } from "./entity/Women"

describe("github issues > #3857 Schema inheritance when STI pattern is used", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres"],
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schema: "custom",
                schemaCreate: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("Child classes should have same schema as parent", () => {
        connections.map((connection) => {
            const personMetadata = connection.getMetadata(Person)
            const menMetadata = connection.getMetadata(Men)
            const womenMetadata = connection.getMetadata(Women)
            expect(personMetadata.schema).to.be.equal("custom")
            expect(menMetadata.schema).to.be.equal(personMetadata.schema)
            expect(womenMetadata.schema).to.be.equal(personMetadata.schema)
        })
    })
})
