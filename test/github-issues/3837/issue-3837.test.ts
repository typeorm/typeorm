import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Table } from "../../../src"
import { xfail } from "../../utils/xfail"

describe("github issues > #3837 named columns", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    xfail
        .unless(() => dataSources.length > 0)
        .it("should allow inserting named columns", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    // Create the categories table.
                    const qr = connection.createQueryRunner()
                    await qr.createTable(
                        new Table({
                            name: "category",
                            columns: [
                                {
                                    name: "id",
                                    type: "int",
                                    isPrimary: true,
                                    isGenerated: true,
                                    generationStrategy: "increment",
                                },
                                {
                                    name: "name",
                                    type: "varchar",
                                },
                            ],
                        }),
                    )

                    const insert = connection.manager.insert("category", [
                        { name: "Easy" },
                        { name: "Medium" },
                        { name: "Hard" },
                    ])

                    return expect(insert).to.fulfilled
                }),
            ),
        )
})
