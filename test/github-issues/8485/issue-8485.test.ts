import { DataSource } from "../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { UserProfile } from "./entity/UserProfile"
import { User } from "./entity/User"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("github issues > #8485 second migration is generated for a combination of PrimaryColumn and JoinColumn", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [User, UserProfile],
                enabledDrivers: [
                    "mariadb",
                    "mysql",
                    "oracle",
                    "postgres",
                    "sap",
                ],
                dropSchema: true,
                schemaCreate: false,
            })),
    )
    after(() => closeTestingConnections(dataSources))

    it("should not create second migration", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.driver.createSchemaBuilder().build()

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                expect(sqlInMemory.upQueries).to.be.empty
                expect(sqlInMemory.downQueries).to.be.empty
            }),
        ))
})
