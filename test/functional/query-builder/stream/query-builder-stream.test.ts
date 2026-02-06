import { expect } from "chai"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Order } from "./entity/Order"
import { User } from "./entity/User"
import { Payment } from "./entity/Payment"
import { Item } from "./entity/Item"
import { Product } from "./entity/Product"
import { Category } from "./entity/Category"

describe("query builder > stream", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Order, User, Payment, Item, Product, Category],
            enabledDrivers: ["postgres", "mysql"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should return correctly structured object when using stream()", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.name = "Alice"
                await dataSource.manager.save(user)

                const category = new Category()
                category.name = "Electronics"
                await dataSource.manager.save(category)

                const product = new Product()
                product.name = "Computer"
                product.category = category
                await dataSource.manager.save(product)

                const order = new Order()
                order.enabled = true
                order.user = user
                await dataSource.manager.save(order)

                const item = new Item()
                item.quantity = 1
                item.product = product
                item.order = order
                await dataSource.manager.save(item)

                const payment = new Payment()
                payment.amount = 100
                payment.order = order
                await dataSource.manager.save(payment)

                const stream = await dataSource
                    .createQueryBuilder(Order, "order")
                    .leftJoinAndSelect("order.user", "user")
                    .leftJoinAndSelect("order.payments", "payment")
                    .leftJoinAndSelect("order.items", "item")
                    .leftJoinAndSelect("item.product", "product")
                    .leftJoinAndSelect("product.category", "category")
                    .where("order.enabled = :enabled", { enabled: true })
                    .orderBy("order.created_at", "DESC")
                    .stream()

                const results: any[] = []
                for await (const chunk of stream) {
                    results.push(chunk)
                }

                expect(results.length).to.be.greaterThan(0)
                const result = results[0]

                expect(result).to.be.instanceOf(Order)
                expect(result).to.have.property("id")
                expect(result).to.have.property("user")
                expect(result.user).to.be.an("object")
                expect(result.user).to.have.property("name", "Alice")
                expect(result).to.have.property("items")
                expect(result.items).to.be.an("array")
                expect(result.items[0].product).to.be.an("object")
                expect(result.items[0].product).to.have.property(
                    "name",
                    "Computer",
                )
                expect(result.items[0].product.category).to.be.an("object")
                expect(result.items[0].product.category).to.have.property(
                    "name",
                    "Electronics",
                )
            }),
        )
    })
})
