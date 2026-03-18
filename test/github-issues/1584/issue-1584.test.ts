import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { User } from "./entity/User"

describe("github issues > #1584 Cannot read property 'createValueMap' of undefined", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mongodb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should save entities properly", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.manager.save(
                    connection.manager.create(User, {
                        name: "Timber Saw",
                    }),
                )
            }),
        ))
})
