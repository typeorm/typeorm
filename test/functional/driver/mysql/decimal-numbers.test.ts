import "reflect-metadata"
import "../../../utils/test-setup"
import { expect } from "chai"
import {
    Column,
    DataSource,
    Entity,
    PrimaryGeneratedColumn,
    Repository,
} from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

@Entity()
class Order {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    orderNo: string

    @Column({ type: "decimal", precision: 20, scale: 2 })
    amount: number | bigint | string
}

const createConnections = async (
    supportBigNumbers: boolean,
    bigNumberStrings: boolean,
) => {
    return await createTestingConnections({
        entities: [Order],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["mysql"],
        driverSpecific: {
            supportBigNumbers,
            bigNumberStrings,
        },
    })
}

const createOrder = (
    orderNo: string,
    amount: number | bigint | string,
): Order => {
    const order = new Order()
    order.orderNo = orderNo
    order.amount = amount
    return order
}

const createOrders = async (repo: Repository<Order>) => {
    await Promise.all(
        [
            // normal amount
            createOrder("O000001", 100.23),
            // 2^53, Number.MAX_SAFE_INTEGER + 1, can be stored exactly
            createOrder("O000002", "9007199254740992"),
            // -2^53, Number.MIN_SAFE_INTEGER - 1, can be stored exactly
            createOrder("O000003", "-9007199254740992"),
            // 2^53 + 1, Number.MAX_SAFE_INTEGER + 2, lost precision
            createOrder("O000004", "9007199254740993"),
            // -2^53 - 1, Number.MIN_SAFE_INTEGER - 2, lost precision
            createOrder("O000005", "-9007199254740993"),
        ].map(async (order) => repo.save(order)),
    )
}
const findOrder = (orders: Array<Order>, orderNo: string): Order => {
    return orders.find((order) => order.orderNo === orderNo)!
}

describe("driver > mysql > decimal numbers > enabled[supportBigNumbers=true, bigNumberStrings=false]", () => {
    let connections: DataSource[]

    before(async () => (connections = await createConnections(true, false)))
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("decimal column read as number, lost precision when out of range [2^53, -2^53]", () =>
        Promise.all(
            connections.map(async (connection) => {
                const orderRepo = connection.getRepository(Order)
                await createOrders(orderRepo)

                const result = await orderRepo.find()
                expect(result.length).eq(5)

                const expectedResults = [
                    { orderNo: "O000001", amount: 100.23 },
                    { orderNo: "O000002", amount: 9007199254740992 },
                    { orderNo: "O000003", amount: -9007199254740992 },
                    { orderNo: "O000004", amount: 9007199254740992 },
                    { orderNo: "O000005", amount: -9007199254740992 },
                ]
                expectedResults.forEach(({ orderNo, amount }) => {
                    const order = findOrder(result, orderNo)
                    expect(typeof order.amount).eq("number")
                    expect(order.amount).eq(amount)
                })
            }),
        ))
})

const readDecimalToString = (
    supportBigNumbers: boolean,
    bigNumberStrings: boolean,
) => {
    return () => {
        let connections: DataSource[]

        before(
            async () =>
                (connections = await createConnections(
                    supportBigNumbers,
                    bigNumberStrings,
                )),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("decimal column read as string", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const orderRepo = connection.getRepository(Order)
                    await createOrders(orderRepo)

                    const result = await orderRepo.find()
                    expect(result.length).eq(5)

                    const expectedResults = [
                        { orderNo: "O000001", amount: "100.23" },
                        { orderNo: "O000002", amount: "9007199254740992.00" },
                        { orderNo: "O000003", amount: "-9007199254740992.00" },
                        { orderNo: "O000004", amount: "9007199254740993.00" },
                        { orderNo: "O000005", amount: "-9007199254740993.00" },
                    ]
                    expectedResults.forEach(({ orderNo, amount }) => {
                        const order = findOrder(result, orderNo)
                        expect(typeof order.amount).eq("string")
                        expect(order.amount).eq(amount)
                    })
                }),
            ))
    }
}

describe(
    "driver > mysql > decimal numbers > disabled[supportBigNumbers=true, bigNumberStrings=true]",
    readDecimalToString(true, true),
)

describe(
    "driver > mysql > decimal numbers > disabled[supportBigNumbers=false, bigNumberStrings=true]",
    readDecimalToString(false, true),
)

describe(
    "driver > mysql > decimal numbers > disabled[supportBigNumbers=false, bigNumberStrings=false]",
    readDecimalToString(false, false),
)
