import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"

describe("github issues > #3151 'uuid' in PrimaryGeneratedColumn causes Many-to-Many Relationship to Fail", () => {
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

    it("should work correctly", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.synchronize()
            }),
        ))
})
