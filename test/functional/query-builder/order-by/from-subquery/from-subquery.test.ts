import { expect } from "chai"
import type { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { User } from "./entity/User"

describe("query-builder > order-by > from subquery", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [User],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should resolve an orderBy alias that refers to a subquery column", async () =>
        await Promise.all(
            dataSources.map(async (connection) => {
                const user = new User()
                user.name = "ABCxyz"
                user.email = "abcxyz@example.com"
                await connection.manager.save(user)

                const userSubQb = connection
                    .getRepository(User)
                    .createQueryBuilder("user")
                    .select("user.id", "id")
                    .addSelect("user.name", "name")
                    .where("user.name = :name", {
                        name: "ABCxyz",
                    })
                    .orderBy("user.name", "ASC")

                const userQuery = connection
                    .createQueryBuilder()
                    .select(["sub.id", "sub.name"])
                    .from("(" + userSubQb.getQuery() + ")", "sub")
                    .orderBy("sub.name", "ASC")
                    .setParameters(userSubQb.getParameters())

                const results = await userQuery.getRawMany()
                expect(results).to.have.length(1)
                expect(results[0].name).to.eq("ABCxyz")
            }),
        ))
})
