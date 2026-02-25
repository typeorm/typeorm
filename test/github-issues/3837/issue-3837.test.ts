import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Table } from "../../../src"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("github issues > #3837 named columns", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should allow inserting named columns using manager.insert()", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const qr = connection.createQueryRunner()
                await qr.createTable(
                    new Table({
                        name: "category",
                        columns: [
                            {
                                name: "id",
                                type: "integer",
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
                await qr.release()

                await connection.manager.insert("category", [
                    { name: "Easy" },
                    { name: "Medium" },
                    { name: "Hard" },
                ])

                let sql: string
                if (DriverUtils.isMySQLFamily(connection.driver)) {
                    sql = `SELECT * FROM \`category\``
                } else {
                    sql = `SELECT * FROM "category"`
                }

                const result = await connection.query(sql)

                const normalizedResult = result.map((row: any) => ({
                    ...row,
                    id: Number(row.id),
                }))
                expect(result).to.have.length(3)
                expect(normalizedResult).to.deep.equal([
                    { id: 1, name: "Easy" },
                    { id: 2, name: "Medium" },
                    { id: 3, name: "Hard" },
                ])
            }),
        ))

    it("should allow inserting named columns using queryBuilder with explicit columns", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const qr = connection.createQueryRunner()
                await qr.createTable(
                    new Table({
                        name: "difficulty",
                        columns: [
                            {
                                name: "id",
                                type: "integer",
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
                await qr.release()

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

                let sql: string
                if (DriverUtils.isMySQLFamily(connection.driver)) {
                    sql = `SELECT * FROM \`difficulty\``
                } else {
                    sql = `SELECT * FROM "difficulty"`
                }

                const result = await connection.query(sql)

                const normalizedResult = result.map((row: any) => ({
                    ...row,
                    id: Number(row.id),
                }))
                expect(result).to.have.length(3)
                expect(normalizedResult).to.deep.equal([
                    { id: 1, type: "Easy" },
                    { id: 2, type: "Medium" },
                    { id: 3, type: "Hard" },
                ])
            }),
        ))

    it("should handle bulk inserts with different column sets and fill missing columns with NULL/default", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const qr = dataSource.createQueryRunner()
                await qr.createTable(
                    new Table({
                        name: "tasks",
                        columns: [
                            {
                                name: "id",
                                type: "integer",
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
                await qr.release()

                await dataSource.manager
                    .createQueryBuilder()
                    .insert()
                    .into("tasks")
                    .values([
                        {
                            description: "First task",
                            name: "Task 1",
                            priority: 1,
                        },
                        { name: "Task 2" },
                        { priority: 2, description: "No name" },
                        { priority: 3 },
                    ])
                    .execute()

                let sql: string
                if (DriverUtils.isMySQLFamily(dataSource.driver)) {
                    sql = `SELECT * FROM \`tasks\` ORDER BY \`id\` ASC`
                } else {
                    sql = `SELECT * FROM "tasks" ORDER BY "id" ASC`
                }
                const rows = await dataSource.query(sql)
                expect(rows).to.have.length(4)

                const normalizedRows = rows.map((row: any) => ({
                    ...row,
                    id: Number(row.id),
                    priority:
                        row.priority !== null ? Number(row.priority) : null,
                }))

                expect(normalizedRows).to.deep.equal([
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

    it("should throw error on inserts with non-nullable columns not provided in values", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const qr = connection.createQueryRunner()
                await qr.createTable(
                    new Table({
                        name: "users",
                        columns: [
                            {
                                name: "id",
                                type: "integer",
                                isPrimary: true,
                                isGenerated: true,
                                generationStrategy: "increment",
                            },
                            {
                                name: "username",
                                type: "varchar",
                                isNullable: false,
                            },
                            {
                                name: "email",
                                type: "varchar",
                                isNullable: false,
                            },
                        ],
                    }),
                )
                await qr.release()

                await expect(
                    connection.manager.insert("users", [
                        { username: "user1" },
                        { email: "user2@example.com" },
                        { username: "user3", email: "user3@example.com" },
                    ]),
                ).to.be.rejected
            }),
        ))
})
