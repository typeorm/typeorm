import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Measurement } from "../entity/Measurement"
import { Order } from "../entity/Order"

describe("database schema > partitioning > cockroachdb > error handling", () => {
    describe("RANGE partitioning edge cases", () => {
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

        it("should create DEFAULT partition for RANGE", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    // Create specific range partition
                    await queryRunner.createPartition!(
                        "measurement",
                        {
                            name: "measurement_2023",
                            values: ["2023-01-01", "2024-01-01"],
                        },
                        "RANGE",
                    )

                    // Create DEFAULT partition
                    await queryRunner.createPartition!(
                        "measurement",
                        {
                            name: "measurement_default",
                            values: ["DEFAULT"],
                        },
                        "RANGE",
                    )

                    const partitions = await queryRunner.getPartitions!(
                        "measurement",
                    )
                    expect(partitions).to.include.members([
                        "measurement_2023",
                        "measurement_default",
                    ])

                    await queryRunner.release()
                }),
            ))

        it("should drop multiple partitions", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    // Create multiple partitions
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

                    let partitions = await queryRunner.getPartitions!(
                        "measurement",
                    )
                    expect(partitions).to.have.lengthOf(2)

                    // Drop first partition
                    await queryRunner.dropPartition!(
                        "measurement",
                        "measurement_2023",
                    )

                    partitions = await queryRunner.getPartitions!("measurement")
                    expect(partitions).to.have.lengthOf(1)
                    expect(partitions).to.include("measurement_2024")

                    // Drop second partition
                    await queryRunner.dropPartition!(
                        "measurement",
                        "measurement_2024",
                    )

                    partitions = await queryRunner.getPartitions!("measurement")
                    expect(partitions).to.have.lengthOf(0)

                    await queryRunner.release()
                }),
            ))

        it("should verify partition key definition", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    const result = await queryRunner.query(`
                        SELECT pg_get_partkeydef(c.oid) AS partition_key
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
    })

    describe("LIST partitioning edge cases", () => {
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

        it("should create partition with single value", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    await queryRunner.createPartition!(
                        "order",
                        {
                            name: "order_single",
                            values: ["US"],
                        },
                        "LIST",
                    )

                    const partitions = await queryRunner.getPartitions!("order")
                    expect(partitions).to.include("order_single")

                    await queryRunner.release()
                }),
            ))

        it("should create partition with multiple values", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    await queryRunner.createPartition!(
                        "order",
                        {
                            name: "order_multi",
                            values: ["US", "CA", "MX"],
                        },
                        "LIST",
                    )

                    const partitions = await queryRunner.getPartitions!("order")
                    expect(partitions).to.include("order_multi")

                    await queryRunner.release()
                }),
            ))

        it("should handle DEFAULT partition for LIST", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    // Create specific partition
                    await queryRunner.createPartition!(
                        "order",
                        {
                            name: "order_us",
                            values: ["US"],
                        },
                        "LIST",
                    )

                    // Create DEFAULT partition
                    await queryRunner.createPartition!(
                        "order",
                        {
                            name: "order_default",
                            values: ["DEFAULT"],
                        },
                        "LIST",
                    )

                    const partitions = await queryRunner.getPartitions!("order")
                    expect(partitions).to.include.members([
                        "order_us",
                        "order_default",
                    ])

                    await queryRunner.release()
                }),
            ))

        it("should list empty partitions array for new table", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    const partitions = await queryRunner.getPartitions!("order")
                    expect(partitions).to.be.an("array")
                    expect(partitions).to.have.lengthOf(0)

                    await queryRunner.release()
                }),
            ))
    })

    describe("HASH partitioning", () => {
        let connections: DataSource[]

        before(async () => {
            connections = await createTestingConnections({
                entities: [],
                enabledDrivers: ["cockroachdb"],
                dropSchema: true,
            })
        })

        after(() => closeTestingConnections(connections))

        it("should create HASH partitioned table", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    // Create HASH partitioned table
                    await queryRunner.query(`
                        CREATE TABLE hash_data (
                            id INT PRIMARY KEY,
                            value TEXT
                        ) PARTITION BY HASH (id)
                    `)

                    // Create HASH partitions
                    await queryRunner.createPartition!(
                        "hash_data",
                        {
                            name: "hash_p0",
                            values: ["4", "0"], // MODULUS 4 REMAINDER 0
                        },
                        "HASH",
                    )

                    await queryRunner.createPartition!(
                        "hash_data",
                        {
                            name: "hash_p1",
                            values: ["4", "1"],
                        },
                        "HASH",
                    )

                    const partitions = await queryRunner.getPartitions!(
                        "hash_data",
                    )
                    expect(partitions).to.have.lengthOf(2)
                    expect(partitions).to.include.members([
                        "hash_p0",
                        "hash_p1",
                    ])

                    await queryRunner.query(`DROP TABLE hash_data`)
                    await queryRunner.release()
                }),
            ))

        it("should verify HASH partition bounds", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    await queryRunner.query(`
                        CREATE TABLE hash_bounds (
                            id INT PRIMARY KEY,
                            data TEXT
                        ) PARTITION BY HASH (id)
                    `)

                    // Create all 4 partitions for MODULUS 4
                    for (let i = 0; i < 4; i++) {
                        await queryRunner.createPartition!(
                            "hash_bounds",
                            {
                                name: `hash_p${i}`,
                                values: ["4", i.toString()],
                            },
                            "HASH",
                        )
                    }

                    const partitions = await queryRunner.getPartitions!(
                        "hash_bounds",
                    )
                    expect(partitions).to.have.lengthOf(4)

                    await queryRunner.query(`DROP TABLE hash_bounds`)
                    await queryRunner.release()
                }),
            ))
    })
})
