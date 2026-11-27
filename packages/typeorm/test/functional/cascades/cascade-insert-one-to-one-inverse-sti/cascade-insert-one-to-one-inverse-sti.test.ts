import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Account } from "./entity/Account"
import { AccountActivationToken } from "./entity/AccountActivationToken"

describe("cascades > insert one-to-one inverse with single table inheritance", () => {
    let dataSources: DataSource[] = []
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("account property in accountActivationToken should not be null", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const account = new Account()
                account.username = "test"
                account.password = "123456"
                account.accountActivationToken = new AccountActivationToken(
                    "XXXXXXXXXXXXXXXXXX",
                    new Date(),
                )

                const savedAccount = await connection.manager.save(account)
                expect(savedAccount.accountActivationToken.account).to.not.be
                    .null
            }),
        ))
})
