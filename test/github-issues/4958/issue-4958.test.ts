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
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import First from "./entity/first"
import Second from "./entity/second"

describe("github issues > #4958 getRepository returns results from another Repo", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [First, Second],
                enabledDrivers: ["sqlite"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("sql generated is for correct model", () => {
        for (const connection of connections) {
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
