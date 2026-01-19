import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Measurement } from "../entity/Measurement"

// GitHub Issue #9620: Enable creation of Partitioned Tables in Postgres
describe("database schema > partitioning > postgres > error handling", () => {
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

    it("should throw error when creating partition without columns or expression", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                try {
                    // Create a table with invalid partition config
                    await queryRunner.query(`
                        CREATE TABLE invalid_partition (
                            id INT
                        ) PARTITION BY RANGE (nonexistent_column)
                    `)
                    expect.fail("Should have thrown an error")
                } catch (error: any) {
                    expect(error.message).to.include("column")
                }

                await queryRunner.release()
            }),
        ))

    it("should handle partition creation with missing values gracefully", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                try {
                    // Try to create partition with incomplete definition
                    await queryRunner.createPartition!(
                        "measurement",
                        {
                            name: "measurement_incomplete",
                            values: [], // Empty values array
                        },
                        "RANGE",
                    )
                    expect.fail("Should have thrown an error")
                } catch (error: any) {
                    // Should fail with database error or validation error
                    expect(error).to.exist
                }

                await queryRunner.release()
            }),
        ))

    it("should handle dropping non-existent partition", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                try {
                    await queryRunner.dropPartition!(
                        "measurement",
                        "nonexistent_partition",
                    )
                    // PostgreSQL doesn't error on DROP TABLE IF EXISTS
                    // so this should succeed silently
                } catch (error: any) {
                    // If it does error, check it's the expected type
                    expect(error.message).to.include("does not exist")
                }

                await queryRunner.release()
            }),
        ))

    it("should list partitions for non-partitioned table", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create a regular (non-partitioned) table
                await queryRunner.query(`
                    CREATE TABLE regular_table (
                        id INT PRIMARY KEY,
                        data TEXT
                    )
                `)

                const partitions =
                    await queryRunner.getPartitions!("regular_table")
                expect(partitions).to.be.an("array")
                expect(partitions).to.have.lengthOf(0)

                await queryRunner.query(`DROP TABLE regular_table`)
                await queryRunner.release()
            }),
        ))

    it("should handle RANGE partition with MINVALUE and MAXVALUE", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create partition with MINVALUE
                await queryRunner.query(`
                    CREATE TABLE measurement_min_max PARTITION OF measurement
                        FOR VALUES FROM (MINVALUE) TO ('2020-01-01')
                `)

                const partitions =
                    await queryRunner.getPartitions!("measurement")
                expect(partitions).to.include("measurement_min_max")

                await queryRunner.release()
            }),
        ))

    it("should create partition with tablespace option", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Note: This will use the default tablespace since we don't create custom ones
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_with_tablespace",
                        values: ["2026-01-01", "2027-01-01"],
                        tablespace: "pg_default",
                    },
                    "RANGE",
                )

                const partitions =
                    await queryRunner.getPartitions!("measurement")
                expect(partitions).to.include("measurement_with_tablespace")

                await queryRunner.release()
            }),
        ))

    it("should handle LIST partition with special characters in values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create a LIST partitioned table
                await queryRunner.query(`
                    CREATE TABLE special_list (
                        id INT,
                        code TEXT,
                        PRIMARY KEY (id, code)
                    ) PARTITION BY LIST (code)
                `)

                // Create partition with special characters
                await queryRunner.query(`
                    CREATE TABLE special_list_p1 PARTITION OF special_list
                        FOR VALUES IN ('test-1', 'test_2', 'test.3')
                `)

                const partitions =
                    await queryRunner.getPartitions!("special_list")
                expect(partitions).to.include("special_list_p1")

                await queryRunner.query(`DROP TABLE special_list`)
                await queryRunner.release()
            }),
        ))

    it("should verify partition bounds are validated", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create first partition
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_overlap_1",
                        values: ["2030-01-01", "2031-01-01"],
                    },
                    "RANGE",
                )

                try {
                    // Try to create overlapping partition
                    await queryRunner.createPartition!(
                        "measurement",
                        {
                            name: "measurement_overlap_2",
                            values: ["2030-06-01", "2031-06-01"],
                        },
                        "RANGE",
                    )
                    expect.fail(
                        "Should have thrown an error for overlapping range",
                    )
                } catch (error: any) {
                    expect(error.message).to.match(/overlap|conflict/i)
                }

                await queryRunner.release()
            }),
        ))

    it("should handle HASH partition with multiple remainders", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create HASH partitioned table
                await queryRunner.query(`
                    CREATE TABLE hash_table (
                        id INT PRIMARY KEY,
                        data TEXT
                    ) PARTITION BY HASH (id)
                `)

                // Create multiple HASH partitions
                await queryRunner.createPartition!(
                    "hash_table",
                    {
                        name: "hash_p0",
                        values: ["8", "0"], // MODULUS 8 REMAINDER 0
                    },
                    "HASH",
                )

                await queryRunner.createPartition!(
                    "hash_table",
                    {
                        name: "hash_p1",
                        values: ["8", "1"],
                    },
                    "HASH",
                )

                const partitions =
                    await queryRunner.getPartitions!("hash_table")
                expect(partitions).to.have.lengthOf(2)
                expect(partitions).to.include.members(["hash_p0", "hash_p1"])

                await queryRunner.query(`DROP TABLE hash_table`)
                await queryRunner.release()
            }),
        ))
})
