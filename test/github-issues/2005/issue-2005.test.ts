import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity/User"

describe("github issues > #2005", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["better-sqlite3"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should be able to find by boolean find", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const user = new User()
                user.activated = true
                await connection.manager.save(user)
                user.activated.should.be.equal(true)
            }),
        ))
})
