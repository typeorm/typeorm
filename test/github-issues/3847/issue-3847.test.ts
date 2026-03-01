import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Animal } from "./entity/Animal"
import { NamingStrategyUnderTest } from "./naming/NamingStrategyUnderTest"

describe("github issues > #3847 FEATURE REQUEST - Naming strategy foreign key override name", () => {
    let dataSources: DataSource[]
    const namingStrategy = new NamingStrategyUnderTest()

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                namingStrategy,
            })),
    )
    beforeEach(() => {
        return reloadTestingDatabases(dataSources)
    })
    after(() => closeTestingConnections(dataSources))

    it("NamingStrategyUnderTest#", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.getRepository(Animal).find()

                const metadata = connection.getMetadata(Animal)

                expect(metadata.foreignKeys[0].name).to.eq(
                    "fk_animal_category_categoryId",
                )
            }),
        ))
})
