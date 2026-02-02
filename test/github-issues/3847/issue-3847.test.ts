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
    let connections: DataSource[]
    const namingStrategy = new NamingStrategyUnderTest()

    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                namingStrategy,
            })),
    )
    beforeEach(() => {
        return reloadTestingDatabases(connections)
    })
    afterAll(() => closeTestingConnections(connections))

    it("NamingStrategyUnderTest#", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.getRepository(Animal).find()

                const metadata = connection.getMetadata(Animal)

                expect(metadata.foreignKeys[0].name).to.eq(
                    "fk_animal_category_categoryId",
                )
            }),
        ))
})
