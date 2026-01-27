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

    it("should handle bulk inserts with different column sets and fill missing columns with NULL/default", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create a table with multiple nullable columns
                const qr = connection.createQueryRunner()
                await qr.createTable(
                    new Table({
                        name: "tasks",
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
                                isNullable: true,
                            },
                            {
                                name: "description",
                                type: "varchar",
                                isNullable: true,
                            },
                            {
                                name: "priority",
                                type: "int",
                                isNullable: true,
                            },
                        ],
                    }),
                )

                // Insert rows with different subsets of columns
                await connection.manager
                    .createQueryBuilder()
                    .insert()
                    .into("tasks")
                    .values([
                        {
                            name: "Task 1",
                            description: "First task",
                            priority: 1,
                        },
                        { name: "Task 2" },
                        { description: "No name", priority: 2 },
                        { priority: 3 },
                    ])
                    .execute()

                // Verify all rows were inserted and missing columns are NULL
                const rows = await connection.query(
                    `SELECT * FROM tasks ORDER BY id ASC`,
                )
                expect(rows).to.have.length(4)
                expect(rows).to.deep.equal([
                    {
                        id: 1,
                        name: "Task 1",
                        description: "First task",
                        priority: 1,
                    },
                    {
                        id: 2,
                        name: "Task 2",
                        description: null,
                        priority: null,
                    },
                    { id: 3, name: null, description: "No name", priority: 2 },
                    { id: 4, name: null, description: null, priority: 3 },
                ])
            }),
        ))
})
