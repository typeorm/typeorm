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
            // oracle/sap fold unquoted identifiers to uppercase, but the
            // outer `sub.name` reference is emitted unquoted while the
            // subquery's aliases are quoted (lowercase) — so the lookup
            // mismatches on those drivers. A TypeORM-side fix in
            // createOrderByExpression (escape the subquery fall-through)
            // would let this list shrink; tracked separately.
            disabledDrivers: ["oracle", "sap"],
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

                // No inner orderBy: the fix (and the regression) is in
                // resolving `sub.name` on the outer query, where `sub` has
                // no entity metadata. An ORDER BY in the subquery would
                // also fail on mssql/oracle/spanner (not allowed inside a
                // derived table without TOP/OFFSET/FOR XML).
                const userSubQb = connection
                    .getRepository(User)
                    .createQueryBuilder("user")
                    .select("user.id", "id")
                    .addSelect("user.name", "name")
                    .where("user.name = :name", {
                        name: "ABCxyz",
                    })

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
