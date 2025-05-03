import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../utils/test-utils"
import { expect } from "chai"
import { User } from "./entity/User"

describe("github issues > #11085 BeforeQuery promises are not awaited before query execution", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    afterEach(async () => {
        await closeTestingConnections(connections)
    })

    it("should find user since beforeQuery promise must be awaited before query execution", async () =>
        Promise.all(
            connections.map(async (connection) => {
                const userRepository = await connection.getRepository(User)

                const user = await userRepository.findBy({
                    isActive: true,
                })

                expect(user.length).to.eq(1)
                expect(user[0].firstName).to.eq("John")
                expect(user[0].lastName).to.eq("Doe")
                expect(user[0].isActive).to.eq(true)
            }),
        ))
})
