import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { User } from "./entity/User"

describe("github issues > #1584 Cannot read property 'createValueMap' of undefined", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["mongodb"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should save entities properly", () =>
        Promise.all(
            connections.map(async (connection) => {
                await connection.manager.save(
                    connection.manager.create(User, {
                        name: "Timber Saw",
                    }),
                )
            }),
        ))
})
