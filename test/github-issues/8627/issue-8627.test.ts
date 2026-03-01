import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
    generateRandomText,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { ThisIsARealLongNameForAnEntityBecauseThisIsNecessary } from "./entity/long-name.entity"

describe("github issues > #8627 junction aliases are not unique", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                dropSchema: true,
                schemaCreate: true,
                name: generateRandomText(10), // Use a different name to avoid a random failure in build pipeline
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not fail querying many-to-many-relation", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const manager = connection.createEntityManager()
                // Nothing special to be checked here, just the query shouldn't fail.
                const result = await manager.find(
                    ThisIsARealLongNameForAnEntityBecauseThisIsNecessary,
                )
                expect(result).to.eql([])
            }),
        ))
})
