import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { Year } from "./entity/year"
import { Month } from "./entity/month"
import { User } from "./entity/user"
import { UserMonth } from "./entity/user-month"

describe.skip("github issues > #1685 JoinColumn from JoinColum is not considered when inserting new value", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mysql"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should not fail when inserting a new UserMonth with good PKs from JoinColumn", () =>
        Promise.all(
            connections.map(async (connection) => {
                const year = new Year()
                year.yearNo = 2018
                await connection.manager.save(year)

                const month = new Month()
                month.year = year
                month.monthNo = 2
                month.yearNo = year.yearNo
                await connection.manager.save(month)

                const user = new User()
                user.username = "bobs"
                await connection.manager.save(user)

                const userMonth = new UserMonth()
                userMonth.user = user
                userMonth.month = month

                try {
                    await connection.manager.save(userMonth)
                } catch {
                    throw new Error("userMonth should be added")
                }
            }),
        ))
})
