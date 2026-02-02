import "reflect-metadata"
import { Product } from "./entity/Product"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("github issues > #1929 Select attributes in Find method - mongodb", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [Product],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("return column on include in select on find", () =>
        Promise.all(
            connections.map(async (connection) => {
                const productRepository = connection.getMongoRepository(Product)
                let product = new Product("test1", "label1", 10)
                await productRepository.save(product)
                product = new Product("test2", "label2", 20)
                await productRepository.save(product)
                product = new Product("test3", "label3", 30)
                await productRepository.save(product)
                await productRepository.find({
                    select: { name: true, label: true },
                    order: { name: 1 },
                })
            }),
        ))

    it("return column on include in select on findAndCount", () =>
        Promise.all(
            connections.map(async (connection) => {
                const productRepository = connection.getMongoRepository(Product)
                let product = new Product("test1", "label1", 10)
                await productRepository.save(product)
                product = new Product("test2", "label2", 20)
                await productRepository.save(product)
                product = new Product("test3", "label3", 30)
                await productRepository.save(product)
                await productRepository.findAndCount({
                    select: { name: true, label: true },
                    order: { name: 1 },
                })
            }),
        ))

    it("return column on include in select on findByIds", () =>
        Promise.all(
            connections.map(async (connection) => {
                const productRepository = connection.getMongoRepository(Product)
                let product = new Product("test1", "label1", 10)
                await productRepository.save(product)
                product = new Product("test2", "label2", 20)
                await productRepository.save(product)
                product = new Product("test3", "label3", 30)
                const product3 = await productRepository.save(product)
                await productRepository.find({
                    where: { _id: product3.id },
                    select: { name: true, label: true },
                    order: { name: 1 },
                })
            }),
        ))

    it("return column on include in select on findByIds ", () =>
        Promise.all(
            connections.map(async (connection) => {
                const productRepository = connection.getMongoRepository(Product)
                let product = new Product("test1", "label1", 10)
                await productRepository.save(product)
                product = new Product("test2", "label2", 20)
                await productRepository.save(product)
                product = new Product("test3", "label3", 30)
                await productRepository.findOne({
                    where: { name: "test2" },
                    select: { name: true, label: true },
                    order: { name: 1 },
                })
            }),
        ))
})
