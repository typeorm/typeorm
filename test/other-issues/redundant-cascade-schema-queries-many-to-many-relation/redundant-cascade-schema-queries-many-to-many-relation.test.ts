import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src"
import { TeamEntity } from "./entity/TeamEntity"
import { UserEntity } from "./entity/UserEntity"

describe("other issues > redundant cascade schema queries in many-to-many relation", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [TeamEntity, UserEntity],
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should work correctly", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.synchronize()
                console.log("------")
                await connection.synchronize()
            }),
        ))
})
