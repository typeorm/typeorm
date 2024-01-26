import { expect } from "chai"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { filterByCteCapabilities } from "./helpers"

describe("query builder > cte > recursive", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should work with simple recursive query", () =>
        Promise.all(
            dataSources
                .filter(filterByCteCapabilities("enabled"))
                .map(async (dataSource) => {
                    // CTE cannot reference itself in Spanner
                    if (dataSource.options.type === "spanner") return

                    let qb: { foo: number }[]
                    if (dataSource.options.type === "oracle") {
                        qb = await dataSource
                            .createQueryBuilder()
                            .select([])
                            .from("cte", "cte")
                            .addCommonTableExpression(
                                `SELECT 1 FROM "DUAL"` +
                                    ` UNION ALL` +
                                    ` SELECT "cte"."foo" + 1` +
                                    ` FROM "cte"` +
                                    ` WHERE "cte"."foo" < 10`,
                                "cte",
                                { recursive: true, columnNames: ["foo"] },
                            )
                            .addSelect(`"cte"."foo"`, "foo")
                            .getRawMany<{ foo: number }>()
                    } else {
                        qb = await dataSource
                            .createQueryBuilder()
                            .select([])
                            .from("cte", "cte")
                            .addCommonTableExpression(
                                `SELECT 1` +
                                    ` UNION ALL` +
                                    ` SELECT cte.foo + 1` +
                                    ` FROM cte` +
                                    ` WHERE cte.foo < 10`,
                                "cte",
                                { recursive: true, columnNames: ["foo"] },
                            )
                            .addSelect("cte.foo", "foo")
                            .getRawMany<{ foo: number }>()
                    }

                    expect(qb).to.have.length(10)
                }),
        ))
})
