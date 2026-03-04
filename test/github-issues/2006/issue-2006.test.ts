import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity/User"

describe("github issues > #2006 Columns are being set to null after saving the entity", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mysql"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should be able to find by boolean find", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const user = new User()
                user.token = "sometoken"
                await connection.manager.save(user)
                user.token.should.be.equal("sometoken")
            }),
        ))
})
