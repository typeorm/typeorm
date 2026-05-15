import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../utils/test-utils"
import type { DataSource } from "../../src/data-source/DataSource"
import { Entity } from "../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../src/decorator/columns/Column"

@Entity()
class Product {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: "unknown" })
    name: string

    @Column({ nullable: true })
    description?: string

    @Column({ default: 0 })
    price: number
}

describe("SAP HANA - DEFAULT VALUES insert", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Product],
                schemaCreate: true,
                dropSchema: true,
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))

    after(() => closeTestingConnections(dataSources))

    it("should not use unsupported DEFAULT VALUES syntax for SAP HANA", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryBuilder = dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(Product)
                    .values({})

                const sql = queryBuilder.getQuery()

                if (dataSource.driver.options.type === "sap") {
                    // SAP HANA should NOT use DEFAULT VALUES (unsupported syntax)
                    expect(sql).to.not.include("DEFAULT VALUES")

                    // SAP HANA should include explicit column names
                    expect(sql).to.include("INSERT INTO")
                    expect(sql).to.include("VALUES")

                    // Should have DEFAULT keyword in VALUES clause
                    // for each column (at least 3: id, name, price)
                    const defaultCount = (sql.match(/DEFAULT/g) || []).length
                    expect(defaultCount).to.be.at.least(3)
                }
            }),
        ))

    it("should successfully insert entity without values", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager
                const product = new Product()

                // Should not throw an error
                const savedProduct = await manager.save(product)

                expect(savedProduct).to.not.be.undefined
                expect(savedProduct.id).to.be.greaterThan(0)

                // Verify default values were applied
                const retrieved = await manager.findOneBy(Product, {
                    id: savedProduct.id,
                })
                expect(retrieved).to.not.be.undefined
                expect(retrieved!.name).to.equal("unknown")
                expect(retrieved!.price).to.equal(0)
            }),
        ))

    it("should insert entity with partial values", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager
                const product = new Product()
                product.name = "Test Product"

                const savedProduct = await manager.save(product)

                expect(savedProduct).to.not.be.undefined
                expect(savedProduct.name).to.equal("Test Product")
                expect(savedProduct.price).to.equal(0)

                const retrieved = await manager.findOneBy(Product, {
                    id: savedProduct.id,
                })
                expect(retrieved!.description).to.be.undefined
            }),
        ))

    it("should insert entity with all values provided", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager
                const product = new Product()
                product.name = "Premium Product"
                product.description = "A premium product"
                product.price = 99.99

                const savedProduct = await manager.save(product)

                expect(savedProduct).to.not.be.undefined

                const retrieved = await manager.findOneBy(Product, {
                    id: savedProduct.id,
                })
                expect(retrieved!.name).to.equal("Premium Product")
                expect(retrieved!.description).to.equal("A premium product")
                expect(retrieved!.price).to.equal(99.99)
            }),
        ))

    it("should handle multiple inserts correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const product1 = new Product()
                const product2 = new Product()
                product2.name = "Product 2"
                product2.price = 50

                await manager.save([product1, product2])

                const count = await manager.count(Product)
                expect(count).to.equal(2)

                const retrieved1 = await manager.findOneBy(Product, {
                    id: product1.id,
                })
                const retrieved2 = await manager.findOneBy(Product, {
                    id: product2.id,
                })

                expect(retrieved1!.name).to.equal("unknown")
                expect(retrieved1!.price).to.equal(0)
                expect(retrieved2!.name).to.equal("Product 2")
                expect(retrieved2!.price).to.equal(50)
            }),
        ))
})
