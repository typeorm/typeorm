import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Customer } from "./entity/customer"
import { Order } from "./entity/order"
import { Ticket } from "./entity/ticket"

describe("github issues > #11109 Two relations using the same column", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("loading customers with relations", () => {
        it("should not throw error when loading entities with relations using EntityManager", async () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.manager.find(Customer)
                }),
            ))

        it("should not throw error when loading entities with relations using Repository", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.getRepository(Customer).find()
                }),
            ))

        it("should not throw error when loading entities with relations using QueryBuilder", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource
                        .createQueryBuilder(Customer, "customers")
                        .getMany()
                }),
            ))
    })

    describe("loading orders with relations", () => {
        it("should not throw error when loading entities with relations using EntityManager", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.manager.find(Order, {
                        relations: { customer: true, tickets: true },
                    })
                }),
            ))

        it("should not throw error when loading entities with relations using Repository", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource
                        .getRepository(Order)
                        .find({ relations: { customer: true, tickets: true } })
                }),
            ))

        it("should not throw error when loading entities with relations using QueryBuilder", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource
                        .createQueryBuilder(Order, "orders")
                        .leftJoinAndSelect("orders.customer", "customer")
                        .leftJoinAndSelect("orders.tickets", "tickets")
                        .getMany()
                }),
            ))
    })

    describe("loading tickets with relations", () => {
        it("should not throw error when loading entities with relations using EntityManager", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.manager.find(Ticket, {
                        relations: { customer: true, order: true },
                    })
                }),
            ))
        it("should not throw error when loading entities with relations using Repository", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource
                        .getRepository(Ticket)
                        .find({ relations: { customer: true, order: true } })
                }),
            ))
        it("should not throw error when loading entities with relations using QueryBuilder", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource
                        .createQueryBuilder(Ticket, "tickets")
                        .leftJoinAndSelect("tickets.customer", "customer")
                        .leftJoinAndSelect("tickets.order", "order")
                        .getMany()
                }),
            ))
    })
})
