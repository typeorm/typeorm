import "../../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { expect } from "chai"
import { DataSource } from "../../../../src"
import { User } from "./entity/User"

describe("query builder > isolated-where", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [User],
                enabledDrivers: ["better-sqlite3"],
                isolateWhereStatements: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly apply brackets when where statement isolation is enabled", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const sql = connection.manager
                    .createQueryBuilder(User, "user")
                    .where("user.id = :userId", { userId: "user-id" })
                    .andWhere(
                        "user.firstName = :search OR user.lastName = :search",
                        {
                            search: "search-term",
                        },
                    )
                    .disableEscaping()
                    .getSql()

                expect(sql).to.be.equal(
                    "SELECT user.id AS user_id, user.firstName AS user_firstName, " +
                        "user.lastName AS user_lastName, user.isAdmin AS user_isAdmin " +
                        "FROM user user " +
                        "WHERE user.id = ? " +
                        "AND (user.firstName = ? OR user.lastName = ?)",
                )
            }),
        ))
})
