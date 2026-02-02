import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"

describe("github issues > #7203 QueryExpressionMap doesn't clone comment field", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                dropSchema: true,
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

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
