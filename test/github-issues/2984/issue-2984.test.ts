import "reflect-metadata"

import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"

describe("github issues > #2984 Discriminator conflict reported even for non-inherited tables", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/**/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should load entities even with the same discriminator", () => {
        dataSources.forEach((connection) => {
            connection.entityMetadatas.should.have.length(5)
            connection.entityMetadatas.forEach((metadata) =>
                metadata.discriminatorValue!.should.be.oneOf([
                    "Note",
                    "OwnerNote",
                ]),
            )
        })
    })
})
