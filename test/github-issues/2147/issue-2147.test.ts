import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/User"

// TODO: wrong test
describe.skip("github issues > #2147 Lazy load JoinColumn with multiple columns name property is ignored for second reference column", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create multiple column join for lazy loading relationship", () => {
        return Promise.all(
            dataSources.map(async (connection) => {
                // tests go here
                const username = "user name"
                const user = new User()
                user.key = 10
                user.clientId = 16
                user.name = username
                user.updatedById = 10
                await connection.manager.save(user)

                const users = await connection.manager.find(User)

                const updatedBy = await users[0].updatedBy

                return expect(updatedBy.name).to.be.equal(username)
            }),
        )
    })
})
