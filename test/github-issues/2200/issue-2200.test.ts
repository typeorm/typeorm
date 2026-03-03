import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { Booking } from "./entity/Booking"
import { NamingStrategyUnderTest } from "./naming/NamingStrategyUnderTest"

describe("github issue > #2200 Bug - Issue with snake_case naming strategy", () => {
    let dataSources: DataSource[]
    const namingStrategy = new NamingStrategyUnderTest()

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                namingStrategy,
            })),
    )
    beforeEach(() => {
        return reloadTestingDatabases(dataSources)
    })
    after(() => closeTestingConnections(dataSources))

    it("Renammed alias allow to query correctly", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.getRepository(Booking).find({ take: 10 })
            }),
        ))
})
