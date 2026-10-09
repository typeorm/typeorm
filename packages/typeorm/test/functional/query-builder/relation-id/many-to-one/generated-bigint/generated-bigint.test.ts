import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import type { DataSource } from "../../../../../../src/data-source/DataSource"
import { Account } from "./entity/Account"
import { Payment } from "./entity/Payment"

describe("query builder > relation-id > many-to-one > generated-bigint", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should load generated bigint ids as strings", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const account = await dataSource.manager.save(new Account())
                const payment = new Payment()
                payment.account = account
                await dataSource.manager.save(payment)

                const loadedPayment = await dataSource.manager.findOneByOrFail(
                    Payment,
                    { id: payment.id },
                )

                expect(loadedPayment.accountId).to.be.equal(String(account.id))
            }),
        ))
})
