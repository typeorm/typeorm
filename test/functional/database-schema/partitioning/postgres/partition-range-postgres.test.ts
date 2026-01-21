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
describe("database schema > partitioning > postgres > range", () => {
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

    it("should create a table with RANGE partition", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Verify table exists and is partitioned
                const result = await queryRunner.query(`
                    SELECT
                        pg_get_partkeydef(c.oid) AS partition_key
                    FROM pg_class c
                    JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE c.relname = 'measurement'
                      AND c.relkind = 'p'
                      AND n.nspname = 'public'
                `)

                expect(result).to.have.lengthOf(1)
                expect(result[0].partition_key).to.include("RANGE")
                expect(result[0].partition_key).to.include("logdate")

                await queryRunner.release()
            }),
        ))

    it("should create partitions dynamically", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create partitions for 2023 and 2024
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_2023",
                        values: ["2023-01-01", "2024-01-01"],
                    },
                    "RANGE",
                )

                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_2024",
                        values: ["2024-01-01", "2025-01-01"],
                    },
                    "RANGE",
                )

                // Verify partitions exist
                const partitions =
                    await queryRunner.getPartitions!("measurement")
                expect(partitions).to.have.lengthOf(2)
                expect(partitions).to.include("measurement_2023")
                expect(partitions).to.include("measurement_2024")

                await queryRunner.release()
            }),
        ))

    it("should route data to correct partition", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create partitions
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_2023",
                        values: ["2023-01-01", "2024-01-01"],
                    },
                    "RANGE",
                )

                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_2024",
                        values: ["2024-01-01", "2025-01-01"],
                    },
                    "RANGE",
                )

                // Insert data
                const repo = connection.getRepository(Measurement)
                await repo.save([
                    {
                        id: 1,
                        logdate: new Date("2023-06-15"),
                        value: 42.5,
                        sensor: "temp_01",
                    },
                    {
                        id: 2,
                        logdate: new Date("2023-12-20"),
                        value: 38.2,
                        sensor: "temp_02",
                    },
                    {
                        id: 3,
                        logdate: new Date("2024-03-10"),
                        value: 55.3,
                        sensor: "temp_03",
                    },
                ])

                // Verify data in correct partitions
                const count2023 = await queryRunner.query(
                    "SELECT COUNT(*) FROM measurement_2023",
                )
                expect(count2023[0].count).to.equal("2")

                const count2024 = await queryRunner.query(
                    "SELECT COUNT(*) FROM measurement_2024",
                )
                expect(count2024[0].count).to.equal("1")

                // Verify we can query the parent table
                const allRecords = await repo.find()
                expect(allRecords).to.have.lengthOf(3)

                await queryRunner.release()
            }),
        ))

    it("should create DEFAULT partition", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create specific partition
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_2023",
                        values: ["2023-01-01", "2024-01-01"],
                    },
                    "RANGE",
                )

                // Create DEFAULT partition for any other values
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_default",
                        values: ["DEFAULT"],
                    },
                    "RANGE",
                )

                // Insert data outside the specific partition range
                const repo = connection.getRepository(Measurement)
                await repo.save({
                    id: 100,
                    logdate: new Date("2025-06-15"),
                    value: 99.9,
                    sensor: "temp_future",
                })

                // Verify data went to default partition
                const countDefault = await queryRunner.query(
                    "SELECT COUNT(*) FROM measurement_default",
                )
                expect(countDefault[0].count).to.equal("1")

                await queryRunner.release()
            }),
        ))

    it("should drop partition", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create two partitions
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_2023",
                        values: ["2023-01-01", "2024-01-01"],
                    },
                    "RANGE",
                )

                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_2024",
                        values: ["2024-01-01", "2025-01-01"],
                    },
                    "RANGE",
                )

                // Verify we have 2 partitions
                let partitions = await queryRunner.getPartitions!("measurement")
                expect(partitions).to.have.lengthOf(2)

                // Drop one partition
                await queryRunner.dropPartition!(
                    "measurement",
                    "measurement_2023",
                )

                // Verify only 1 partition remains
                partitions = await queryRunner.getPartitions!("measurement")
                expect(partitions).to.have.lengthOf(1)
                expect(partitions).to.include("measurement_2024")
                expect(partitions).to.not.include("measurement_2023")

                await queryRunner.release()
            }),
        ))

    it("should handle partition with tablespace", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Note: This test creates partition with tablespace option
                // In real usage, the tablespace must exist first
                await queryRunner.createPartition!(
                    "measurement",
                    {
                        name: "measurement_2023",
                        values: ["2023-01-01", "2024-01-01"],
                        tablespace: "pg_default", // Using default tablespace
                    },
                    "RANGE",
                )

                const partitions =
                    await queryRunner.getPartitions!("measurement")
                expect(partitions).to.include("measurement_2023")

                await queryRunner.release()
            }),
        ))
})
