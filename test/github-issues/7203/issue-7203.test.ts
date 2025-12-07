import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
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

describe("github issues > #7203 QueryExpressionMap doesn't clone comment field", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should be able to clone comment field", () => {
        for (const connection of connections) {
            const comment = "a comment"
            const queryBuilder = connection
                .createQueryBuilder()
                .comment(comment)
            const clonedQueryBuilder = queryBuilder.clone()
            expect(clonedQueryBuilder.expressionMap.comment).to.equal(comment)
        }
    })
})
