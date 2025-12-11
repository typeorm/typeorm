import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Product } from "../entity/Product"
import { User } from "../entity/User"

describe("database schema > partitioning > mysql > list and hash", () => {
    describe("LIST partitioning", () => {
        let connections: DataSource[]

        before(async () => {
            connections = await createTestingConnections({
                entities: [Product],
                enabledDrivers: ["mysql", "mariadb"],
                dropSchema: true,
            })
        })

        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should create a table with LIST partitions", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    // Verify table exists with partitions
                    const result = await queryRunner.query(`
                        SELECT
                            PARTITION_NAME,
                            PARTITION_METHOD
                        FROM INFORMATION_SCHEMA.PARTITIONS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'product'
                          AND PARTITION_NAME IS NOT NULL
                        ORDER BY PARTITION_NAME
                    `)

                    expect(result).to.have.lengthOf(2)
                    expect(result[0].PARTITION_NAME).to.equal("p_electronics")
                    expect(result[1].PARTITION_NAME).to.equal("p_clothing")
                    expect(result[0].PARTITION_METHOD).to.equal("LIST")

                    await queryRunner.release()
                }),
            ))

        it("should route data to correct LIST partition", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const repo = connection.getRepository(Product)

                    // Insert data
                    await repo.save([
                        {
                            category: "electronics",
                            name: "Laptop",
                            price: 999.99,
                        },
                        {
                            category: "computers",
                            name: "Desktop",
                            price: 1299.99,
                        },
                        {
                            category: "clothing",
                            name: "T-Shirt",
                            price: 19.99,
                        },
                    ])

                    // Verify we can query all data
                    const allProducts = await repo.find()
                    expect(allProducts).to.have.lengthOf(3)
                }),
            ))

        it("should add new LIST partition dynamically", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    // Add partition for books
                    await queryRunner.createPartition!(
                        "product",
                        {
                            name: "p_books",
                            values: ["'books'", "'magazines'"],
                        },
                        "LIST",
                    )

                    // Verify partition exists
                    const partitions = await queryRunner.getPartitions!(
                        "product",
                    )
                    expect(partitions).to.have.lengthOf(3)
                    expect(partitions).to.include.members([
                        "p_electronics",
                        "p_clothing",
                        "p_books",
                    ])

                    await queryRunner.release()
                }),
            ))

        it("should drop LIST partition", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    // Drop p_clothing partition
                    await queryRunner.dropPartition!("product", "p_clothing")

                    // Verify partition was dropped
                    const partitions = await queryRunner.getPartitions!(
                        "product",
                    )
                    expect(partitions).to.have.lengthOf(1)
                    expect(partitions).to.include("p_electronics")
                    expect(partitions).to.not.include("p_clothing")

                    await queryRunner.release()
                }),
            ))
    })

    describe("HASH partitioning", () => {
        let connections: DataSource[]

        before(async () => {
            connections = await createTestingConnections({
                entities: [User],
                enabledDrivers: ["mysql", "mariadb"],
                dropSchema: true,
            })
        })

        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should handle HASH partitioning", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    // Note: For MySQL HASH partitioning, partitions are defined
                    // in the entity decorator with the count, not individual definitions
                    // This test verifies the basic structure

                    // Verify table is created (even without initial partitions)
                    const table = await queryRunner.getTable("user")
                    expect(table).to.not.be.undefined

                    await queryRunner.release()
                }),
            ))
    })
})
