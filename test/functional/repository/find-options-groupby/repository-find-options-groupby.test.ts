import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Sale } from "./entity/Sale"

describe("repository > find options > groupBy", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres", "mysql", "mariadb", "sqlite"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should group by a single column", () =>
        Promise.all(
            connections.map(async (connection) => {
                const sale1 = new Sale()
                sale1.product = "Laptop"
                sale1.category = "Electronics"
                sale1.amount = 1200.5
                sale1.date = new Date("2024-01-01")
                await connection.manager.save(sale1)

                const sale2 = new Sale()
                sale2.product = "Mouse"
                sale2.category = "Electronics"
                sale2.amount = 25.99
                sale2.date = new Date("2024-01-02")
                await connection.manager.save(sale2)

                const sale3 = new Sale()
                sale3.product = "Desk"
                sale3.category = "Furniture"
                sale3.amount = 350.0
                sale3.date = new Date("2024-01-03")
                await connection.manager.save(sale3)

                // Use queryBuilder to verify the GROUP BY functionality
                const results = await connection
                    .getRepository(Sale)
                    .createQueryBuilder("sale")
                    .select("sale.category", "category")
                    .addSelect("COUNT(*)", "count")
                    .groupBy("sale.category")
                    .getRawMany()

                expect(results).to.have.lengthOf(2)
                expect(results.find((r: any) => r.category === "Electronics"))
                    .to.exist
                expect(results.find((r: any) => r.category === "Furniture")).to
                    .exist
            }),
        ))

    it("should group by a single column using repository.find()", () =>
        Promise.all(
            connections.map(async (connection) => {
                const sale1 = new Sale()
                sale1.product = "Laptop"
                sale1.category = "Electronics"
                sale1.amount = 1200.5
                sale1.date = new Date("2024-01-01")
                await connection.manager.save(sale1)

                const sale2 = new Sale()
                sale2.product = "Mouse"
                sale2.category = "Electronics"
                sale2.amount = 25.99
                sale2.date = new Date("2024-01-02")
                await connection.manager.save(sale2)

                const sale3 = new Sale()
                sale3.product = "Desk"
                sale3.category = "Furniture"
                sale3.amount = 350.0
                sale3.date = new Date("2024-01-03")
                await connection.manager.save(sale3)

                // Test using repository.find() with groupBy - verify it generates correct SQL
                // Note: This will generate SQL with GROUP BY but actual execution requires
                // proper SELECT with aggregates which find() doesn't support
                const qb = connection
                    .getRepository(Sale)
                    .createQueryBuilder("sale")

                // Simulate what find() does internally
                qb.setFindOptions({ groupBy: "sale.category" })

                const sql = qb.getSql()
                expect(sql).to.include("GROUP BY")
                expect(sql).to.include("sale")
                expect(sql).to.include("category")
            }),
        ))

    it("should group by multiple columns using array", () =>
        Promise.all(
            connections.map(async (connection) => {
                const sale1 = new Sale()
                sale1.product = "Laptop"
                sale1.category = "Electronics"
                sale1.amount = 1200.5
                sale1.date = new Date("2024-01-01")
                await connection.manager.save(sale1)

                const sale2 = new Sale()
                sale2.product = "Mouse"
                sale2.category = "Electronics"
                sale2.amount = 25.99
                sale2.date = new Date("2024-01-02")
                await connection.manager.save(sale2)

                const sale3 = new Sale()
                sale3.product = "Laptop"
                sale3.category = "Electronics"
                sale3.amount = 1100.0
                sale3.date = new Date("2024-01-03")
                await connection.manager.save(sale3)

                // Test using find with multiple groupBy columns
                const queryBuilder = connection
                    .getRepository(Sale)
                    .createQueryBuilder("sale")
                    .setFindOptions({
                        groupBy: ["sale.category", "sale.product"],
                    })

                // Verify that GROUP BY was added to the query with both columns
                const sql = queryBuilder.getSql()
                expect(sql).to.include("GROUP BY")
                expect(sql).to.match(/sale.*category/)
                expect(sql).to.match(/sale.*product/)
            }),
        ))

    it("should work with aggregate functions in practical usage", () =>
        Promise.all(
            connections.map(async (connection) => {
                const sale1 = new Sale()
                sale1.product = "Laptop"
                sale1.category = "Electronics"
                sale1.amount = 1200.5
                sale1.date = new Date("2024-01-01")
                await connection.manager.save(sale1)

                const sale2 = new Sale()
                sale2.product = "Mouse"
                sale2.category = "Electronics"
                sale2.amount = 25.99
                sale2.date = new Date("2024-01-02")
                await connection.manager.save(sale2)

                const sale3 = new Sale()
                sale3.product = "Desk"
                sale3.category = "Furniture"
                sale3.amount = 350.0
                sale3.date = new Date("2024-01-03")
                await connection.manager.save(sale3)

                // Practical usage: setFindOptions() with groupBy, then add aggregates
                const results = await connection
                    .getRepository(Sale)
                    .createQueryBuilder("sale")
                    .setFindOptions({ groupBy: "sale.category" })
                    .select("sale.category", "category")
                    .addSelect("COUNT(sale.id)", "count")
                    .addSelect("SUM(sale.amount)", "total")
                    .getRawMany()

                expect(results).to.have.lengthOf(2)
                const electronics = results.find(
                    (r: any) => r.category === "Electronics",
                )
                const furniture = results.find(
                    (r: any) => r.category === "Furniture",
                )

                expect(electronics).to.exist
                expect(furniture).to.exist
                expect(parseInt(electronics.count)).to.equal(2)
                expect(parseInt(furniture.count)).to.equal(1)
            }),
        ))

    it("should work with where clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                const sale1 = new Sale()
                sale1.product = "Laptop"
                sale1.category = "Electronics"
                sale1.amount = 1200.5
                sale1.date = new Date("2024-01-01")
                await connection.manager.save(sale1)

                const sale2 = new Sale()
                sale2.product = "Mouse"
                sale2.category = "Electronics"
                sale2.amount = 25.99
                sale2.date = new Date("2024-01-02")
                await connection.manager.save(sale2)

                const sale3 = new Sale()
                sale3.product = "Desk"
                sale3.category = "Furniture"
                sale3.amount = 350.0
                sale3.date = new Date("2024-01-03")
                await connection.manager.save(sale3)

                // Test combining groupBy with where
                const queryBuilder = connection
                    .getRepository(Sale)
                    .createQueryBuilder("sale")
                    .setFindOptions({
                        where: { category: "Electronics" },
                        groupBy: "sale.product",
                    })

                const sql = queryBuilder.getSql()
                expect(sql).to.include("WHERE")
                expect(sql).to.include("GROUP BY")
            }),
        ))
})
