import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Table } from "../../../src"

describe("github issues > #3837 named columns", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should allow inserting named columns using manager.insert()", () =>
        Promise.all(
            connections.map(async (connection) => {
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
        ))

    it("should allow inserting named columns using queryBuilder with explicit columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create the difficulties table.
                const qr = connection.createQueryRunner()
                await qr.createTable(
                    new Table({
                        name: "difficulty",
                        columns: [
                            {
                                name: "id",
                                type: "int",
                                isPrimary: true,
                                isGenerated: true,
                                generationStrategy: "increment",
                            },
                            {
                                name: "type",
                                type: "varchar",
                            },
                        ],
                    }),
                )

                const data = [
                    { type: "Easy" },
                    { type: "Medium" },
                    { type: "Hard" },
                ]

                await connection.manager
                    .createQueryBuilder()
                    .insert()
                    .into("difficulty", ["type"])
                    .values(data)
                    .execute()

                const result = await connection.query(
                    `SELECT COUNT(*) as count FROM difficulty`,
                )
                const count = parseInt(
                    result[0].count ||
                        result[0].COUNT ||
                        result[0].count_ ||
                        result[0].COUNT_,
                    10,
                )

                return expect(count).to.equal(3)
            }),
        ))
})
