import { expect } from "chai"
import { Connection } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { filterByCteCapabilities } from "./helpers"

describe("query builder > cte > recursive", () => {
    let connections: Connection[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should work with simple recursive query", () =>
        Promise.all(
            connections
                .filter(filterByCteCapabilities("enabled"))
                .map(async (connection) => {
                    // CTE cannot reference itself in Spanner
                    if (connection.options.type === "spanner") return

                    const qb = await connection
                        .createQueryBuilder()
                        .select([])
                        .from("cte", "cte")
                        .addCommonTableExpression(
                            `
                    SELECT 1
                    UNION ALL
                    SELECT cte.foo + 1
                    FROM cte
                    WHERE cte.foo < 10
                `,
                            "cte",
                            { recursive: true, columnNames: ["foo"] },
                        )
                        .addSelect("cte.foo", "foo")
                        .getRawMany<{ foo: number }>()

                    expect(qb).to.have.length(10)
                }),
        ))
})
