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
import { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"

describe("github issue > #1282 FEATURE REQUEST - Naming strategy joinTableColumnName if it is called from the owning or owned (inverse) context ", () => {
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

                const metadata = connection.getManyToManyMetadata(
                    Animal,
                    "categories",
                )

                let columns: ColumnMetadata[]
                if (metadata !== undefined) {
                    columns = metadata.columns
                } else {
                    columns = []
                }

                expect(
                    columns.find(
                        (column: ColumnMetadata) =>
                            column.databaseName === "animalIdForward",
                    ),
                ).not.to.be.undefined

                expect(
                    columns.find(
                        (column: ColumnMetadata) =>
                            column.databaseName === "categoryIdInverse",
                    ),
                ).not.to.be.undefined
            }),
        ))
})
