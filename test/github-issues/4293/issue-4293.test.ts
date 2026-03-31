import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User, UserStatus } from "./entity/User"
import { expect } from "chai"
import type { DataSource, QueryDeepPartialEntity } from "../../../src"

describe("github issues > #4293 Transformed value not returned on save", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres", "mysql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should populate an object with the transformed database value after inserting", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user: QueryDeepPartialEntity<User> = {
                    balance: 50,
                    status: UserStatus.INACTIVE,
                }

                await dataSource.manager.insert(User, user)

                expect(user.id).to.be.a("number")
                expect(user.balance).to.be.a("number").and.to.equal(50)
                expect(user.status)
                    .to.be.a("string")
                    .and.to.equal(UserStatus.INACTIVE)

                // get raw database value to verify that the transformer is working correctly
                const rawUser = await dataSource.manager
                    .createQueryBuilder(User, "user")
                    .select("user.balance", "balance")
                    .where("user.id = :id", { id: user.id })
                    .getRawOne()

                expect(rawUser.balance).to.be.a("number").and.to.equal(5000)
            }),
        ))

    it("should populate an object with the transformed default database value after inserting", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user: QueryDeepPartialEntity<User> = {}

                await dataSource.manager.insert(User, user)

                expect(user.id).to.be.a("number")
                expect(user.balance).to.be.a("number").and.to.equal(25)
                expect(user.status)
                    .to.be.a("string")
                    .and.to.equal(UserStatus.ACTIVE)

                // get raw database value to verify that the transformer is working correctly
                const rawUser = await dataSource.manager
                    .createQueryBuilder(User, "user")
                    .select("user.balance", "balance")
                    .where("user.id = :id", { id: user.id })
                    .getRawOne()

                expect(rawUser.balance).to.be.a("number").and.to.equal(2500)
            }),
        ))
})
