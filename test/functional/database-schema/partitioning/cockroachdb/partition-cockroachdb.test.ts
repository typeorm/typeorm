import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Order } from "../entity/Order"
import { Measurement } from "../entity/Measurement"

describe("database schema > partitioning > cockroachdb", () => {
    describe("LIST partitioning", () => {
        let connections: DataSource[]

        before(async () => {
            connections = await createTestingConnections({
                entities: [Order],
                enabledDrivers: ["cockroachdb"],
                dropSchema: true,
            })
        })

        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should create a table with LIST partition", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    // Verify table exists and is partitioned
                    // CockroachDB uses same pg_class structure as PostgreSQL
                    const result = await queryRunner.query(`
                        SELECT
                            pg_get_partkeydef(c.oid) AS partition_key
                        FROM pg_class c
                        JOIN pg_namespace n ON n.oid = c.relnamespace
                        WHERE c.relname = 'order'
                          AND c.relkind = 'p'
                          AND n.nspname = 'public'
                    `)

                    expect(result).to.have.lengthOf(1)
                    expect(result[0].partition_key).to.include("LIST")
                    expect(result[0].partition_key).to.include("region")

                    await queryRunner.release()
                }),
            ))

        it("should create and manage LIST partitions", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    // Create regional partitions
                    await queryRunner.createPartition!(
                        "order",
                        {
                            name: "order_us",
                            values: ["US"],
                        },
                        "LIST",
                    )

                    await queryRunner.createPartition!(
                        "order",
                        {
                            name: "order_eu",
                            values: ["UK", "DE", "FR"],
                        },
                        "LIST",
                    )

                    // Verify partitions exist
                    const partitions = await queryRunner.getPartitions!("order")
                    expect(partitions).to.have.lengthOf(2)
                    expect(partitions).to.include.members([
                        "order_us",
                        "order_eu",
                    ])

                    // Insert data
                    const repo = connection.getRepository(Order)
                    await repo.save([
                        {
                            id: 1,
                            region: "US",
                            amount: 100.0,
                            customer: "Alice",
                        },
                        {
                            id: 2,
                            region: "UK",
                            amount: 200.0,
                            customer: "Bob",
                        },
                    ])

                    // Verify data
                    const allOrders = await repo.find()
                    expect(allOrders).to.have.lengthOf(2)

                    await queryRunner.release()
                }),
            ))
    })

    describe("RANGE partitioning", () => {
        let connections: DataSource[]

        before(async () => {
            connections = await createTestingConnections({
                entities: [Measurement],
                enabledDrivers: ["cockroachdb"],
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

        it("should create and drop RANGE partitions", () =>
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

                    // Verify partitions
                    let partitions = await queryRunner.getPartitions!(
                        "measurement",
                    )
                    expect(partitions).to.have.lengthOf(2)

                    // Drop one partition
                    await queryRunner.dropPartition!(
                        "measurement",
                        "measurement_2023",
                    )

                    // Verify only one remains
                    partitions = await queryRunner.getPartitions!("measurement")
                    expect(partitions).to.have.lengthOf(1)
                    expect(partitions).to.include("measurement_2024")

                    await queryRunner.release()
                }),
            ))
    })
})
