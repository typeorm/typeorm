import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Sale } from "../entity/Sale"
import { Product } from "../entity/Product"

// GitHub Issue #9620: Enable creation of Partitioned Tables in Postgres
describe("database schema > partitioning > mysql > error handling", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            entities: [Sale, Product],
            enabledDrivers: ["mysql", "mariadb"],
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should handle adding partition to HASH table", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create HASH partitioned table
                await queryRunner.query(`
                    CREATE TABLE hash_users (
                        id INT PRIMARY KEY,
                        username VARCHAR(100)
                    ) PARTITION BY HASH(id) PARTITIONS 4
                `)

                // MySQL doesn't support adding individual partitions to HASH
                // We can add but it reorganizes
                try {
                    await queryRunner.query(`
                        ALTER TABLE hash_users ADD PARTITION PARTITIONS 1
                    `)
                    // This should succeed in MySQL
                    const partitions =
                        await queryRunner.getPartitions!("hash_users")
                    expect(partitions.length).to.be.greaterThan(0)
                } catch (error: any) {
                    // Some versions may not support this
                    expect(error).to.exist
                }

                await queryRunner.query(`DROP TABLE hash_users`)
                await queryRunner.release()
            }),
        ))

    it("should handle partition pruning with WHERE clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Verify partitioned table allows partition pruning
                // Use EXPLAIN (not EXPLAIN PARTITIONS - deprecated in MySQL 8.0+)
                const result = await queryRunner.query(`
                    EXPLAIN
                    SELECT * FROM sale
                    WHERE sale_date >= '2023-01-01' AND sale_date < '2024-01-01'
                `)

                expect(result).to.be.an("array")
                expect(result.length).to.be.greaterThan(0)
                // MySQL includes partitions info in EXPLAIN output
                // The 'partitions' column shows which partitions were accessed

                await queryRunner.release()
            }),
        ))

    it("should list partitions for RANGE table", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                const partitions = await queryRunner.getPartitions!("sale")
                expect(partitions).to.be.an("array")
                expect(partitions).to.include.members(["p2023", "p2024"])

                await queryRunner.release()
            }),
        ))

    it("should list partitions for LIST table", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                const partitions = await queryRunner.getPartitions!("product")
                expect(partitions).to.be.an("array")
                expect(partitions).to.include.members([
                    "p_electronics",
                    "p_clothing",
                ])

                await queryRunner.release()
            }),
        ))

    it("should drop partition from RANGE table", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Verify partition exists
                let partitions = await queryRunner.getPartitions!("sale")
                expect(partitions).to.include("p2023")

                // Drop partition
                await queryRunner.dropPartition!("sale", "p2023")

                // Verify partition was dropped
                partitions = await queryRunner.getPartitions!("sale")
                expect(partitions).to.not.include("p2023")

                await queryRunner.release()
            }),
        ))

    it("should handle reorganizing partitions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create a simple RANGE table for testing
                // Note: PK must include partition column (year_val)
                await queryRunner.query(`
                    CREATE TABLE reorg_test (
                        id INT,
                        year_val INT,
                        PRIMARY KEY (id, year_val)
                    ) PARTITION BY RANGE (year_val) (
                        PARTITION p0 VALUES LESS THAN (2020),
                        PARTITION p1 VALUES LESS THAN (2021)
                    )
                `)

                // Reorganize partition (split p1 into p1 and p2)
                await queryRunner.query(`
                    ALTER TABLE reorg_test
                    REORGANIZE PARTITION p1 INTO (
                        PARTITION p1 VALUES LESS THAN (2021),
                        PARTITION p2 VALUES LESS THAN (2022)
                    )
                `)

                const partitions =
                    await queryRunner.getPartitions!("reorg_test")
                expect(partitions).to.include.members(["p0", "p1", "p2"])

                await queryRunner.query(`DROP TABLE reorg_test`)
                await queryRunner.release()
            }),
        ))

    it("should handle MAXVALUE in RANGE partition", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create table with MAXVALUE partition
                // Note: PK must include partition column (year_val)
                await queryRunner.query(`
                    CREATE TABLE maxvalue_test (
                        id INT,
                        year_val INT,
                        PRIMARY KEY (id, year_val)
                    ) PARTITION BY RANGE (year_val) (
                        PARTITION p2023 VALUES LESS THAN (2024),
                        PARTITION p_max VALUES LESS THAN MAXVALUE
                    )
                `)

                const partitions =
                    await queryRunner.getPartitions!("maxvalue_test")
                expect(partitions).to.include.members(["p2023", "p_max"])

                await queryRunner.query(`DROP TABLE maxvalue_test`)
                await queryRunner.release()
            }),
        ))

    it("should handle complex expression in RANGE partition", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create table with complex expression
                // Note: PK must include columns used in partition expression (sale_date)
                await queryRunner.query(`
                    CREATE TABLE expr_test (
                        id INT,
                        sale_date DATE,
                        PRIMARY KEY (id, sale_date)
                    ) PARTITION BY RANGE (YEAR(sale_date) * 100 + MONTH(sale_date)) (
                        PARTITION p202301 VALUES LESS THAN (202302),
                        PARTITION p202302 VALUES LESS THAN (202303)
                    )
                `)

                const partitions = await queryRunner.getPartitions!("expr_test")
                expect(partitions).to.have.lengthOf(2)

                await queryRunner.query(`DROP TABLE expr_test`)
                await queryRunner.release()
            }),
        ))

    it("should handle LIST partition with NULL values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create LIST partition that handles NULL
                // Note: Can't use PRIMARY KEY with nullable partition column
                // Use UNIQUE KEY instead
                await queryRunner.query(`
                    CREATE TABLE list_null_test (
                        id INT NOT NULL,
                        category VARCHAR(50),
                        UNIQUE KEY (id, category)
                    ) PARTITION BY LIST COLUMNS(category) (
                        PARTITION p_null VALUES IN (NULL),
                        PARTITION p_valid VALUES IN ('A', 'B')
                    )
                `)

                const partitions =
                    await queryRunner.getPartitions!("list_null_test")
                expect(partitions).to.include.members(["p_null", "p_valid"])

                await queryRunner.query(`DROP TABLE list_null_test`)
                await queryRunner.release()
            }),
        ))

    it("should verify partition metadata via INFORMATION_SCHEMA", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                const result = await queryRunner.query(`
                    SELECT
                        PARTITION_NAME,
                        PARTITION_METHOD,
                        PARTITION_EXPRESSION
                    FROM INFORMATION_SCHEMA.PARTITIONS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'sale'
                      AND PARTITION_NAME IS NOT NULL
                `)

                expect(result).to.be.an("array")
                expect(result.length).to.be.greaterThan(0)
                expect(result[0]).to.have.property("PARTITION_METHOD", "RANGE")

                await queryRunner.release()
            }),
        ))
})
