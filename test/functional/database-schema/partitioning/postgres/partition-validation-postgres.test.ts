import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Measurement } from "../entity/Measurement"

describe("database schema > partitioning > postgres > validation", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            entities: [Measurement],
            enabledDrivers: ["postgres"],
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should throw error for RANGE partition with wrong number of values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                try {
                    // Try to create RANGE partition with only 1 value (not DEFAULT/MAXVALUE)
                    await queryRunner.createPartition!(
                        "measurement",
                        {
                            name: "measurement_invalid",
                            values: ["2023-01-01"], // Missing second value
                        },
                        "RANGE",
                    )
                    expect.fail("Should have thrown TypeORMError")
                } catch (error: any) {
                    expect(error.message).to.include(
                        "RANGE partition requires 2 values",
                    )
                }

                await queryRunner.release()
            }),
        ))

    it("should throw error for RANGE partition with 3+ values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                try {
                    await queryRunner.createPartition!(
                        "measurement",
                        {
                            name: "measurement_invalid",
                            values: ["2023-01-01", "2024-01-01", "2025-01-01"],
                        },
                        "RANGE",
                    )
                    expect.fail("Should have thrown TypeORMError")
                } catch (error: any) {
                    expect(error.message).to.include(
                        "RANGE partition requires 2 values",
                    )
                }

                await queryRunner.release()
            }),
        ))

    it("should handle RANGE partition with MAXVALUE", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create specific partition first
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_2023",
                        values: ["2023-01-01", "2024-01-01"],
                    },
                    "RANGE",
                )

                // Create MAXVALUE partition
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_maxvalue",
                        values: ["MAXVALUE"],
                    },
                    "RANGE",
                )

                const partitions = await queryRunner.getPartitions!(
                    "measurement",
                )
                expect(partitions).to.include.members([
                    "measurement_2023",
                    "measurement_maxvalue",
                ])

                await queryRunner.release()
            }),
        ))

    it("should throw error for HASH partition with wrong number of values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create HASH partitioned table
                await queryRunner.query(`
                    CREATE TABLE hash_invalid (
                        id INT PRIMARY KEY
                    ) PARTITION BY HASH (id)
                `)

                try {
                    // Only 1 value (missing remainder)
                    await queryRunner.createPartition!(
                        "hash_invalid",
                        {
                            name: "hash_p0",
                            values: ["4"], // Missing remainder
                        },
                        "HASH",
                    )
                    expect.fail("Should have thrown TypeORMError")
                } catch (error: any) {
                    expect(error.message).to.include(
                        "HASH partition requires 2 values",
                    )
                }

                await queryRunner.query(`DROP TABLE hash_invalid`)
                await queryRunner.release()
            }),
        ))

    it("should throw error for HASH partition with 3+ values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                await queryRunner.query(`
                    CREATE TABLE hash_invalid2 (
                        id INT PRIMARY KEY
                    ) PARTITION BY HASH (id)
                `)

                try {
                    await queryRunner.createPartition!(
                        "hash_invalid2",
                        {
                            name: "hash_p0",
                            values: ["4", "0", "extra"],
                        },
                        "HASH",
                    )
                    expect.fail("Should have thrown TypeORMError")
                } catch (error: any) {
                    expect(error.message).to.include(
                        "HASH partition requires 2 values",
                    )
                }

                await queryRunner.query(`DROP TABLE hash_invalid2`)
                await queryRunner.release()
            }),
        ))

    it("should handle LIST partition with DEFAULT", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create LIST partitioned table
                await queryRunner.query(`
                    CREATE TABLE list_default (
                        id INT,
                        code TEXT,
                        PRIMARY KEY (id, code)
                    ) PARTITION BY LIST (code)
                `)

                // Create specific partition
                await queryRunner.createPartition!(
                    "list_default",
                    {
                        name: "list_p1",
                        values: ["A", "B", "C"],
                    },
                    "LIST",
                )

                // Create DEFAULT partition using proper SQL syntax
                await queryRunner.query(`
                    CREATE TABLE list_default_p PARTITION OF list_default DEFAULT
                `)

                const partitions = await queryRunner.getPartitions!(
                    "list_default",
                )
                expect(partitions).to.include.members([
                    "list_p1",
                    "list_default_p",
                ])

                await queryRunner.query(`DROP TABLE list_default`)
                await queryRunner.release()
            }),
        ))

    it("should handle empty partition list (no partitions created yet)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Get partitions before creating any
                const partitions = await queryRunner.getPartitions!(
                    "measurement",
                )
                expect(partitions).to.be.an("array")
                expect(partitions).to.have.lengthOf(0)

                await queryRunner.release()
            }),
        ))

    it("should handle partition with very long values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create LIST partition with long string values
                await queryRunner.query(`
                    CREATE TABLE long_values (
                        id INT,
                        code TEXT,
                        PRIMARY KEY (id, code)
                    ) PARTITION BY LIST (code)
                `)

                const longValue = "A".repeat(100)
                await queryRunner.createPartition!(
                    "long_values",
                    {
                        name: "long_p1",
                        values: [longValue, "short"],
                    },
                    "LIST",
                )

                const partitions = await queryRunner.getPartitions!(
                    "long_values",
                )
                expect(partitions).to.include("long_p1")

                await queryRunner.query(`DROP TABLE long_values`)
                await queryRunner.release()
            }),
        ))

    it("should handle RANGE partition with date strings", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Test various date formats
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_dates",
                        values: ["2023-01-01", "2023-12-31"],
                    },
                    "RANGE",
                )

                const partitions = await queryRunner.getPartitions!(
                    "measurement",
                )
                expect(partitions).to.include("measurement_dates")

                await queryRunner.release()
            }),
        ))

    it("should handle LIST partition with numeric strings", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                await queryRunner.query(`
                    CREATE TABLE numeric_list (
                        id INT,
                        code TEXT,
                        PRIMARY KEY (id, code)
                    ) PARTITION BY LIST (code)
                `)

                await queryRunner.createPartition!(
                    "numeric_list",
                    {
                        name: "numeric_p1",
                        values: ["123", "456", "789"],
                    },
                    "LIST",
                )

                const partitions = await queryRunner.getPartitions!(
                    "numeric_list",
                )
                expect(partitions).to.include("numeric_p1")

                await queryRunner.query(`DROP TABLE numeric_list`)
                await queryRunner.release()
            }),
        ))

    it("should handle HASH partition with large modulus", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                await queryRunner.query(`
                    CREATE TABLE large_hash (
                        id INT PRIMARY KEY
                    ) PARTITION BY HASH (id)
                `)

                // Create partition with modulus 100
                await queryRunner.createPartition!(
                    "large_hash",
                    {
                        name: "large_hash_p0",
                        values: ["100", "0"],
                    },
                    "HASH",
                )

                await queryRunner.createPartition!(
                    "large_hash",
                    {
                        name: "large_hash_p50",
                        values: ["100", "50"],
                    },
                    "HASH",
                )

                const partitions = await queryRunner.getPartitions!(
                    "large_hash",
                )
                expect(partitions).to.have.lengthOf(2)

                await queryRunner.query(`DROP TABLE large_hash`)
                await queryRunner.release()
            }),
        ))

    it("should verify partition exists after creation", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create partition
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_verify",
                        values: ["2028-01-01", "2029-01-01"],
                    },
                    "RANGE",
                )

                // Immediately verify it exists
                const partitions = await queryRunner.getPartitions!(
                    "measurement",
                )
                expect(partitions).to.include("measurement_verify")

                // Verify we can query the partition table
                const result = await queryRunner.query(
                    "SELECT COUNT(*) FROM measurement_verify",
                )
                expect(result[0].count).to.equal("0")

                await queryRunner.release()
            }),
        ))

    it("should handle dropping partition that was just created", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create and immediately drop
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_temp",
                        values: ["2029-01-01", "2030-01-01"],
                    },
                    "RANGE",
                )

                let partitions = await queryRunner.getPartitions!("measurement")
                expect(partitions).to.include("measurement_temp")

                await queryRunner.dropPartition!(
                    "measurement",
                    "measurement_temp",
                )

                partitions = await queryRunner.getPartitions!("measurement")
                expect(partitions).to.not.include("measurement_temp")

                await queryRunner.release()
            }),
        ))

    it("should handle partition with tablespace option", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create partition with explicit tablespace
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_ts",
                        values: ["2030-01-01", "2031-01-01"],
                        tablespace: "pg_default",
                    },
                    "RANGE",
                )

                const partitions = await queryRunner.getPartitions!(
                    "measurement",
                )
                expect(partitions).to.include("measurement_ts")

                // Verify tablespace was set
                const result = await queryRunner.query(`
                    SELECT tablespace
                    FROM pg_tables
                    WHERE tablename = 'measurement_ts'
                `)
                // Note: NULL means pg_default in PostgreSQL
                expect(result).to.have.lengthOf(1)

                await queryRunner.release()
            }),
        ))
})
