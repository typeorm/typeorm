import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Order } from "../entity/Order"

describe("database schema > partitioning > postgres > list", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            entities: [Order],
            enabledDrivers: ["postgres"],
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

    it("should create LIST partitions for different regions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create partitions for different regions
                await queryRunner.createPartition!(
                    "order",
                    {
                        name: "order_north_america",
                        values: ["US", "CA", "MX"],
                    },
                    "LIST",
                )

                await queryRunner.createPartition!(
                    "order",
                    {
                        name: "order_europe",
                        values: ["UK", "DE", "FR"],
                    },
                    "LIST",
                )

                await queryRunner.createPartition!(
                    "order",
                    {
                        name: "order_asia",
                        values: ["JP", "CN", "IN"],
                    },
                    "LIST",
                )

                // Verify partitions exist
                const partitions = await queryRunner.getPartitions!("order")
                expect(partitions).to.have.lengthOf(3)
                expect(partitions).to.include.members([
                    "order_north_america",
                    "order_europe",
                    "order_asia",
                ])

                await queryRunner.release()
            }),
        ))

    it("should route data to correct partition based on region", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create partitions
                await queryRunner.createPartition!(
                    "order",
                    {
                        name: "order_north_america",
                        values: ["US", "CA", "MX"],
                    },
                    "LIST",
                )

                await queryRunner.createPartition!(
                    "order",
                    {
                        name: "order_europe",
                        values: ["UK", "DE", "FR"],
                    },
                    "LIST",
                )

                // Insert data
                const repo = connection.getRepository(Order)
                await repo.save([
                    {
                        id: 1,
                        region: "US",
                        amount: 100.5,
                        customer: "Alice",
                    },
                    {
                        id: 2,
                        region: "CA",
                        amount: 75.25,
                        customer: "Bob",
                    },
                    {
                        id: 3,
                        region: "UK",
                        amount: 200.0,
                        customer: "Charlie",
                    },
                    {
                        id: 4,
                        region: "DE",
                        amount: 150.75,
                        customer: "Diana",
                    },
                ])

                // Verify data in correct partitions
                const countNA = await queryRunner.query(
                    "SELECT COUNT(*) FROM order_north_america",
                )
                expect(countNA[0].count).to.equal("2")

                const countEU = await queryRunner.query(
                    "SELECT COUNT(*) FROM order_europe",
                )
                expect(countEU[0].count).to.equal("2")

                // Verify we can query the parent table
                const allOrders = await repo.find()
                expect(allOrders).to.have.lengthOf(4)

                await queryRunner.release()
            }),
        ))

    it("should handle single value LIST partitions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create partitions with single values
                await queryRunner.createPartition!(
                    "order",
                    {
                        name: "order_us_only",
                        values: ["US"],
                    },
                    "LIST",
                )

                await queryRunner.createPartition!(
                    "order",
                    {
                        name: "order_uk_only",
                        values: ["UK"],
                    },
                    "LIST",
                )

                const partitions = await queryRunner.getPartitions!("order")
                expect(partitions).to.have.lengthOf(2)

                await queryRunner.release()
            }),
        ))
})
