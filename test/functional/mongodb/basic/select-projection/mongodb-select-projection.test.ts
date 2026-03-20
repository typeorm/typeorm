import { expect } from "chai"
import "reflect-metadata"
import { Product } from "./entity/Product"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("mongodb > select projection", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Product],
            enabledDrivers: ["mongodb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should only return selected columns on find", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const productRepository = connection.getMongoRepository(Product)
                await productRepository.save(new Product("test1", "label1", 10))
                await productRepository.save(new Product("test2", "label2", 20))

                const products = await productRepository.find({
                    select: { name: true, label: true },
                    order: { name: 1 },
                })

                expect(products).to.have.length(2)
                expect(products[0].name).to.equal("test1")
                expect(products[0].label).to.equal("label1")
                expect(products[0].price).to.be.undefined
            }),
        ))

    it("should only return selected columns on findAndCount", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const productRepository = connection.getMongoRepository(Product)
                await productRepository.save(new Product("test1", "label1", 10))
                await productRepository.save(new Product("test2", "label2", 20))

                const [products, count] = await productRepository.findAndCount({
                    select: { name: true, label: true },
                    order: { name: 1 },
                })

                expect(count).to.equal(2)
                expect(products[0].name).to.equal("test1")
                expect(products[0].price).to.be.undefined
            }),
        ))

    it("should only return selected columns on find with where", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const productRepository = connection.getMongoRepository(Product)
                await productRepository.save(new Product("test1", "label1", 10))
                const saved = await productRepository.save(
                    new Product("test2", "label2", 20),
                )

                const products = await productRepository.find({
                    where: { _id: saved.id },
                    select: { name: true, label: true },
                })

                expect(products).to.have.length(1)
                expect(products[0].name).to.equal("test2")
                expect(products[0].label).to.equal("label2")
                expect(products[0].price).to.be.undefined
            }),
        ))

    it("should return id when ObjectIdColumn is selected", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const productRepository = connection.getMongoRepository(Product)
                const saved = await productRepository.save(
                    new Product("test1", "label1", 10),
                )

                const products = await productRepository.find({
                    select: { id: true, name: true },
                })

                expect(products).to.have.length(1)
                expect(products[0].id).to.not.be.undefined
                expect(products[0].id.toString()).to.equal(saved.id.toString())
                expect(products[0].name).to.equal("test1")
                expect(products[0].price).to.be.undefined
            }),
        ))

    it("should only return selected columns on findOne with where", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const productRepository = connection.getMongoRepository(Product)
                await productRepository.save(new Product("test1", "label1", 10))
                await productRepository.save(new Product("test2", "label2", 20))

                const product = await productRepository.findOne({
                    where: { name: "test2" },
                    select: { name: true, label: true },
                })

                expect(product).to.not.be.null
                expect(product!.name).to.equal("test2")
                expect(product!.label).to.equal("label2")
                expect(product!.price).to.be.undefined
            }),
        ))
})
