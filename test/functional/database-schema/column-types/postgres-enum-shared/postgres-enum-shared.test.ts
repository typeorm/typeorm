import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Table } from "../../../../../src"
import { Column } from "../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { expect } from "chai"

describe("database schema > column types > postgres-enum-shared", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["postgres"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not drop shared enum when dropping one of the columns", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // create table A with shared enum
                await queryRunner.createTable(
                    new Table({
                        name: "table_a",
                        columns: [
                            {
                                name: "status",
                                type: "enum",
                                enum: ["A", "B"],
                                enumName: "shared_status_enum",
                            },
                        ],
                    }),
                )

                // create table B with shared enum
                await queryRunner.createTable(
                    new Table({
                        name: "table_b",
                        columns: [
                            {
                                name: "status",
                                type: "enum",
                                enum: ["A", "B"],
                                enumName: "shared_status_enum",
                            },
                        ],
                    }),
                )

                // drop column from table A
                const tableA = await queryRunner.getTable("table_a")
                const columnA = tableA!.findColumnByName("status")!
                await queryRunner.dropColumn(tableA!, columnA)

                // enum should still exist because table B uses it
                const result = await queryRunner.query(
                    `SELECT * FROM "pg_type" WHERE "typname" = 'shared_status_enum'`,
                )
                result.length.should.be.equal(1)

                await queryRunner.release()
            }),
        ))

    it("should handle changeColumn on shared enum", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // create table A with shared enum
                await queryRunner.createTable(
                    new Table({
                        name: "table_change_a",
                        columns: [
                            {
                                name: "status",
                                type: "enum",
                                enum: ["A", "B"],
                                enumName: "shared_status_change_enum",
                            },
                        ],
                    }),
                )

                // create table B with shared enum
                await queryRunner.createTable(
                    new Table({
                        name: "table_change_b",
                        columns: [
                            {
                                name: "status",
                                type: "enum",
                                enum: ["A", "B"],
                                enumName: "shared_status_change_enum",
                            },
                        ],
                    }),
                )

                // modify enum in table A (add value)
                const tableA = await queryRunner.getTable("table_change_a")
                const columnA = tableA!.findColumnByName("status")!
                const newColumnA = columnA.clone()
                newColumnA.enum = ["A", "B", "C"]

                await queryRunner.changeColumn(tableA!, columnA, newColumnA)

                // Check if enum is updated
                const result = await queryRunner.query(
                    `SELECT * FROM "pg_enum" WHERE "enumtypid" = (SELECT oid FROM pg_type WHERE typname = 'shared_status_change_enum')`,
                )
                const labels = result.map((r: any) => r.enumlabel)
                expect(labels).to.include("C")

                await queryRunner.release()
            }),
        ))

    it("should fail when changing shared enum via replacement (removing value)", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // create table A with shared enum
                await queryRunner.createTable(
                    new Table({
                        name: "table_change_fail_a",
                        columns: [
                            {
                                name: "status",
                                type: "enum",
                                enum: ["A", "B"],
                                enumName: "shared_status_fail_enum",
                            },
                        ],
                    }),
                )

                // create table B with shared enum
                await queryRunner.createTable(
                    new Table({
                        name: "table_change_fail_b",
                        columns: [
                            {
                                name: "status",
                                type: "enum",
                                enum: ["A", "B"],
                                enumName: "shared_status_fail_enum",
                            },
                        ],
                    }),
                )

                // modify enum in table A (remove value) -> Forces type replacement
                const tableA = await queryRunner.getTable("table_change_fail_a")
                const columnA = tableA!.findColumnByName("status")!
                const newColumnA = columnA.clone()
                newColumnA.enum = ["B"]

                let error
                try {
                    await queryRunner.changeColumn(tableA!, columnA, newColumnA)
                } catch (e) {
                    error = e
                }

                // Currently it fails with database error because it tries to DROP the used type
                // We expect it to fail commonly because it's in use
                expect(error).to.not.be.undefined

                await queryRunner.release()
            }),
        ))

    it("should successfully rename enum when it is used by another table and schema is default", async () => {
        // 1. Create entities with shared enum
        @Entity("entity_default_a")
        class EntityDefaultA {
            @PrimaryGeneratedColumn()
            id: number

            @Column("enum", {
                enum: ["PENDING", "ACTIVE", "INACTIVE"],
                enumName: "status_enum_default",
            })
            status: string
        }

        @Entity("entity_default_b")
        class EntityDefaultB {
            @PrimaryGeneratedColumn()
            id: number

            @Column("enum", {
                enum: ["PENDING", "ACTIVE", "INACTIVE"],
                enumName: "status_enum_default",
            })
            status: string
        }

        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.destroy()
                dataSource.setOptions({
                    entities: [EntityDefaultA, EntityDefaultB],
                })
                await dataSource.initialize()
                await dataSource.synchronize()
            }),
        )

        // 2. Change EntityDefaultA to use a new enum name and new values
        @Entity("entity_default_a")
        class EntityDefaultA_V2 {
            @PrimaryGeneratedColumn()
            id: number

            @Column("enum", {
                enum: ["PENDING", "ACTIVE", "INACTIVE", "ARCHIVED"],
                enumName: "status_enum_default_v2",
            })
            status: string
        }

        @Entity("entity_default_b")
        class EntityDefaultB_V2 {
            @PrimaryGeneratedColumn()
            id: number

            @Column("enum", {
                enum: ["PENDING", "ACTIVE", "INACTIVE"],
                enumName: "status_enum_default",
            })
            status: string
        }

        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.destroy()
                dataSource.setOptions({
                    entities: [EntityDefaultA_V2, EntityDefaultB_V2],
                })
                await dataSource.initialize()
                await dataSource.synchronize()
            }),
        )
    })

    it("should reuse existing enum when renaming and enum exists", async () => {
        // 1. Initial state: Two independent enums
        @Entity("entity_a")
        class EntityA {
            @PrimaryGeneratedColumn()
            id: number

            @Column("enum", {
                enum: ["A", "B"],
                enumName: "enum_a",
            })
            status: string
        }

        @Entity("entity_b")
        class EntityB {
            @PrimaryGeneratedColumn()
            id: number

            @Column("enum", {
                enum: ["C", "D"],
                enumName: "enum_b",
            })
            status: string
        }

        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.destroy()
                dataSource.setOptions({
                    entities: [EntityA, EntityB],
                })
                await dataSource.initialize()
                await dataSource.synchronize()
            }),
        )

        // 2. Rename enum_a to enum_b, so they share the same enum type
        @Entity("entity_a")
        class EntityA_V2 {
            @PrimaryGeneratedColumn()
            id: number

            @Column("enum", {
                enum: ["C", "D"], // Now matches EntityB's enum
                enumName: "enum_b", // Renaming to existing enum
            })
            status: string
        }

        @Entity("entity_b")
        class EntityB_V2 {
            @PrimaryGeneratedColumn()
            id: number

            @Column("enum", {
                enum: ["C", "D"],
                enumName: "enum_b",
            })
            status: string
        }

        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.destroy()
                dataSource.setOptions({
                    entities: [EntityA_V2, EntityB_V2],
                })
                await dataSource.initialize()
                await dataSource.synchronize()
            }),
        )
    })

    it("should successfully add value to shared enum using IF NOT EXISTS", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                // Skip if Postgres version is less than 12, as IF NOT EXISTS is not supported
                if (
                    connection.driver.options.type === "postgres" &&
                    parseInt(connection.driver.version || "0") < 12
                ) {
                    return
                }

                const queryRunner = connection.createQueryRunner()

                // 1. Create independent tables using the SAME enum
                // Table A
                await queryRunner.createTable(
                    new Table({
                        name: "table_a",
                        columns: [
                            {
                                name: "status",
                                type: "enum",
                                enum: ["A", "B"],
                                enumName: "shared_add_value_enum",
                            },
                        ],
                    }),
                )

                // Table B uses same enum
                await queryRunner.createTable(
                    new Table({
                        name: "table_b",
                        columns: [
                            {
                                name: "status",
                                type: "enum",
                                enum: ["A", "B"],
                                enumName: "shared_add_value_enum",
                            },
                        ],
                    }),
                )

                // 2. Prepare schema update: ADD 'C' to both tables definition
                const tableA = await queryRunner.getTable("table_a")
                const columnA = tableA!.findColumnByName("status")!
                const newColumnA = columnA.clone()
                newColumnA.enum = ["A", "B", "C"]

                const tableB = await queryRunner.getTable("table_b")
                const columnB = tableB!.findColumnByName("status")!
                const newColumnB = columnB.clone()
                newColumnB.enum = ["A", "B", "C"]

                // 3. Apply change on Table A -> this performs ALTER TYPE ... ADD VALUE 'C'
                await queryRunner.changeColumn(tableA!, columnA, newColumnA)

                // 4. Apply change on Table B -> this SHOULD perform ALTER TYPE ... ADD VALUE IF NOT EXISTS 'C'
                // Without IF NOT EXISTS, this would fail saying 'C' already exists
                await queryRunner.changeColumn(tableB!, columnB, newColumnB)

                // Verification
                const result = await queryRunner.query(
                    `SELECT * FROM "pg_enum" WHERE "enumtypid" = (SELECT oid FROM pg_type WHERE typname = 'shared_add_value_enum')`,
                )
                const labels = result.map((r: any) => r.enumlabel)

                // Should contain C
                if (labels.indexOf("C") === -1) {
                    throw new Error("Enum value C was not added")
                }

                await queryRunner.release()
            }),
        ))
})
