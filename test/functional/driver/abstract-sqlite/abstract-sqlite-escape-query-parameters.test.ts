import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../../utils/test-utils"

describe("escape sqlite query parameters", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["better-sqlite3"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should transform boolean parameters with value `true` into `1`", () =>
        dataSources.map((connection) => {
            const [_, parameters] = connection.driver.escapeQueryWithParameters(
                "SELECT nothing FROM irrelevant WHERE a = :param1",
                { param1: true },
            )

            expect(parameters).to.deep.equal([1])
        }))

    it("should transform boolean parameters with value `false` into `0`", () =>
        dataSources.map((connection) => {
            const [_, parameters] = connection.driver.escapeQueryWithParameters(
                "SELECT nothing FROM irrelevant WHERE a = :param1",
                { param1: false },
            )

            expect(parameters).to.deep.equal([0])
        }))
})
