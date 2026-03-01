import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import First from "./entity/first"
import Second from "./entity/second"

describe("github issues > #4958 getRepository returns results from another Repo", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [First, Second],
                enabledDrivers: ["better-sqlite3"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("sql generated is for correct model", () => {
        for (const connection of dataSources) {
            const rawSql = connection
                .getRepository(Second)
                .createQueryBuilder("a")
                .getSql()

            expect(rawSql).to.be.equal(
                'SELECT "a"."notId" AS "a_notId" FROM "second" "a"',
            )
        }
    })
})
