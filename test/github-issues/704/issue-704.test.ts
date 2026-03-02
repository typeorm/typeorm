import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { User } from "./entity/User"

describe("github issues > #704 Table alias in WHERE clause is not quoted in PostgreSQL", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should return user by a given email and proper escape 'user' keyword", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const user = new User()
                user.email = "john@example.com"
                await connection.manager.save(user)

                const loadedUser = await connection
                    .getRepository(User)
                    .findOneBy({ email: "john@example.com" })

                loadedUser!.id.should.be.equal(1)
                loadedUser!.email.should.be.equal("john@example.com")
            }),
        ))
})
