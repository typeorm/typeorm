import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { SubUser } from "./entity/User"
import { expect } from "chai"

describe("github issues > #2253 - inserting multiple child entities fails", () => {
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

    it("should be able to save multiple child entities", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const user1 = new SubUser()
                user1.id = 1
                const user2 = new SubUser()
                user2.id = 2
                await connection.manager.save([user1, user2])
                const users = connection.getRepository(SubUser)
                expect(await users.count()).to.eql(2)
            }),
        ))
})
