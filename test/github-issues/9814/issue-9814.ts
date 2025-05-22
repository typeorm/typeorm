import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { TypeormTestPrimary } from "./entity"

describe("github issues > #9814 @JoinColumn doesn't work more than once with same column", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: [
                    "mysql",
                    "mariadb",
                    "postgres",
                    "mssql",
                    "oracle",
                    "mongodb",
                ],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not throw error when loading entities with relations using EntityManager", async () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository(TypeormTestPrimary)
                    .find({ relations: { secondary: true, tertiary: true } })
            }),
        ))
})
