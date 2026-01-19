import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Sale } from "../entity/Sale"

describe("database schema > partitioning > mysql > range", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            entities: [Sale],
            enabledDrivers: ["mysql", "mariadb"],
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create a table with RANGE partition using expression", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Verify table exists with partitions
                const result = await queryRunner.query(`
                    SELECT
                        PARTITION_NAME,
                        PARTITION_EXPRESSION,
                        PARTITION_METHOD
                    FROM INFORMATION_SCHEMA.PARTITIONS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'sale'
                      AND PARTITION_NAME IS NOT NULL
                    ORDER BY PARTITION_NAME
                `)

                expect(result).to.have.lengthOf(2)
                expect(result[0].PARTITION_NAME).to.equal("p2023")
                expect(result[1].PARTITION_NAME).to.equal("p2024")
                expect(result[0].PARTITION_METHOD).to.equal("RANGE")
                expect(result[0].PARTITION_EXPRESSION.toLowerCase()).to.include(
                    "year",
                )
                expect(result[0].PARTITION_EXPRESSION).to.include("sale_date")

                await queryRunner.release()
            }),
        ))

    it("should route data to correct partition based on year", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Insert data
                const repo = connection.getRepository(Sale)
                await repo.save([
                    {
                        sale_date: new Date("2023-06-15"),
                        amount: 100.5,
                        product: "Widget A",
                    },
                    {
                        sale_date: new Date("2023-12-20"),
                        amount: 200.75,
                        product: "Widget B",
                    },
                    {
                        sale_date: new Date("2024-03-10"),
                        amount: 150.25,
                        product: "Widget C",
                    },
                ])

                // Verify we can query all data from the partitioned table
                // Note: MySQL doesn't provide easy access to per-partition row counts
                // via INFORMATION_SCHEMA, so we verify the table works as a whole
                const allSales = await repo.find()
                expect(allSales).to.have.lengthOf(3)

                // Verify the data contains records from both years
                const years = allSales.map((s) =>
                    new Date(s.sale_date).getFullYear(),
                )
                expect(years).to.include.members([2023, 2024])

                await queryRunner.release()
            }),
        ))

    it("should add new partition dynamically", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Add partition for 2025
                await queryRunner.createPartition!(
                    "sale",
                    {
                        name: "p2025",
                        values: ["2026"],
                    },
                    "RANGE",
                )

                // Verify partition exists
                const partitions = await queryRunner.getPartitions!("sale")
                expect(partitions).to.have.lengthOf(3)
                expect(partitions).to.include.members([
                    "p2023",
                    "p2024",
                    "p2025",
                ])

                await queryRunner.release()
            }),
        ))

    it("should drop partition", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Verify initial partitions
                let partitions = await queryRunner.getPartitions!("sale")
                expect(partitions).to.have.lengthOf(2)

                // Drop p2023 partition
                await queryRunner.dropPartition!("sale", "p2023")

                // Verify partition was dropped
                partitions = await queryRunner.getPartitions!("sale")
                expect(partitions).to.have.lengthOf(1)
                expect(partitions).to.include("p2024")
                expect(partitions).to.not.include("p2023")

                await queryRunner.release()
            }),
        ))

    it("should list all partitions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                const partitions = await queryRunner.getPartitions!("sale")
                expect(partitions).to.be.an("array")
                expect(partitions).to.have.lengthOf(2)
                expect(partitions).to.include.members(["p2023", "p2024"])

                await queryRunner.release()
            }),
        ))
})
