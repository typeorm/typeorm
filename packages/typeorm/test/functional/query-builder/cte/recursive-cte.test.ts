import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { filterByCteCapabilities } from "./helpers"

describe("query builder > cte > recursive", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should work with simple recursive query", () =>
        Promise.all(
            dataSources
                .filter(filterByCteCapabilities("enabled"))
                .map(async (dataSource) => {
                    if (
                        dataSource.options.type === "sap" ||
                        dataSource.options.type === "spanner"
                    ) {
                        // CTE cannot reference itself in SAP HANA / Spanner
                        return
                    }

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

    // GitHub issue #12489 - Recursive CTEs order dependent, can't have more than one
    it("should support multiple mixed-recursive CTEs", () =>
        Promise.all(
            dataSources
                .filter(filterByCteCapabilities("enabled"))
                .map(async (dataSource) => {
                    if (
                        dataSource.options.type === "sap" ||
                        dataSource.options.type === "spanner"
                    ) {
                        // CTE cannot reference itself in SAP HANA / Spanner
                        return
                    }

                    let qb: { foo: number }[]
                    if (dataSource.options.type === "oracle") {
                        qb = await dataSource
                            .createQueryBuilder()
                            .select([])
                            .from("cte1", "cte1")
                            .innerJoin(
                                "cte2",
                                "cte2",
                                `"cte1"."foo" = "cte2"."foo"`,
                            )
                            .innerJoin(
                                "cte3",
                                "cte3",
                                `"cte1"."foo" = "cte3"."foo"`,
                            )
                            .addCommonTableExpression(
                                `SELECT LEVEL AS "foo" FROM "DUAL" CONNECT BY LEVEL <= 10`,
                                "cte1",
                                { recursive: false, columnNames: ["foo"] },
                            )
                            .addCommonTableExpression(
                                `SELECT 1 FROM "DUAL"` +
                                    ` UNION ALL` +
                                    ` SELECT "cte2"."foo" + 1` +
                                    ` FROM "cte2"` +
                                    ` WHERE "cte2"."foo" < 10`,
                                "cte2",
                                { recursive: true, columnNames: ["foo"] },
                            )
                            .addCommonTableExpression(
                                `SELECT 1 FROM "DUAL"` +
                                    ` UNION ALL` +
                                    ` SELECT "cte3"."foo" + 1` +
                                    ` FROM "cte3"` +
                                    ` WHERE "cte3"."foo" < 10`,
                                "cte3",
                                { recursive: true, columnNames: ["foo"] },
                            )
                            .addSelect(`"cte1"."foo"`, "foo")
                            .getRawMany<{ foo: number }>()
                    } else {
                        qb = await dataSource
                            .createQueryBuilder()
                            .select([])
                            .from("cte1", "cte1")
                            .innerJoin("cte2", "cte2", "cte1.foo = cte2.foo")
                            .innerJoin("cte3", "cte3", "cte1.foo = cte3.foo")
                            .addCommonTableExpression(
                                [...Array(10)]
                                    .map((_, i) => `SELECT ${i + 1} AS foo`)
                                    .join(" UNION "),
                                "cte1",
                                { columnNames: ["foo"] },
                            )
                            .addCommonTableExpression(
                                `SELECT 1 AS foo` +
                                    ` UNION ALL` +
                                    ` SELECT cte2.foo + 1` +
                                    ` FROM cte2` +
                                    ` WHERE cte2.foo < 10`,
                                "cte2",
                                { recursive: true, columnNames: ["foo"] },
                            )
                            .addCommonTableExpression(
                                `SELECT 1 AS foo` +
                                    ` UNION ALL` +
                                    ` SELECT cte3.foo + 1` +
                                    ` FROM cte3` +
                                    ` WHERE cte3.foo < 10`,
                                "cte3",
                                { recursive: true, columnNames: ["foo"] },
                            )
                            .addSelect("cte1.foo", "foo")
                            .getRawMany<{ foo: number }>()
                    }

                    expect(qb).to.have.length(10)
                }),
        ))
})
