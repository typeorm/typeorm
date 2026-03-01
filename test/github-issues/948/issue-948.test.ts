import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { User } from "./entity/User"

describe("github issues > #948 EntityManager#save always considers a Postgres array-type field to have changed", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not produce extra query when array is updated?", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const user = new User()
                user.name = "Hello Test"
                user.roles = ["admin", "user"]
                await connection.manager.save(user)

                // todo: produces update query but it should not
                await connection.manager.save(user)
            }),
        ))
})
