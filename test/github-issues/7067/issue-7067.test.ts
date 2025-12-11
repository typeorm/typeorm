import "reflect-metadata"
import "../../utils/test-setup"
import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Order } from "./entity"

describe("github issues > #7067 MySQL2 driver won't cast DECIMAL to number (missing mysql2 specific config)", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Order],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mysql"],
                driverSpecific: {
                    supportBigNumbers: true,
                    bigNumberStrings: false,
                },
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("decimal column read as number", () =>
        Promise.all(
            connections.map(async (connection) => {
                const orderRepo = connection.getRepository(Order)

                const order = new Order()
                order.orderNo = "O00001"
                order.amount = 100.23
                await orderRepo.save(order)

                const result = await orderRepo.findOne({
                    where: {
                        id: 1,
                    },
                })

                expect(result!.orderNo).eq("O00001")
                expect(result!.amount).eq(100.23)
            }),
        ))
})
