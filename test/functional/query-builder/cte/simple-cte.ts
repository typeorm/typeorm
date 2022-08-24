import "reflect-metadata"
import { expect } from "chai"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Connection } from "../../../../src/connection/Connection"
import { Foo } from "./entity/foo"
import { filterByCteCapabilities } from "./helpers"

describe("query builder > cte > simple", () => {
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

    it("show allow select from CTE", () =>
        Promise.all(
            connections
                .filter(filterByCteCapabilities("enabled"))
                .map(async (connection) => {
                    await connection
                        .getRepository(Foo)
                        .insert(
                            [1, 2, 3].map((i) => ({ id: i, bar: String(i) })),
                        )
                    const cteQuery = connection
                        .createQueryBuilder()
                        .select()
                        .addSelect(`foo.bar`, "bar")
                        .from(Foo, "foo")
                        .where(`foo.bar = :value`, { value: "2" })

                    // Spanner does not support column names in CTE
                    const cteOptions =
                        connection.driver.options.type === "spanner"
                            ? undefined
                            : {
                                  columnNames: ["raz"],
                              }
                    const cteSelection =
                        connection.driver.options.type === "spanner"
                            ? "qaz.bar"
                            : "qaz.raz"

                    const qb = await connection
                        .createQueryBuilder()
                        .addCommonTableExpression(cteQuery, "qaz", cteOptions)
                        .from("qaz", "qaz")
                        .select([])
                        .addSelect(cteSelection, "raz")

                    expect(await qb.getRawMany()).to.deep.equal([{ raz: "2" }])
                }),
        ))

    it("should allow join with CTE", () =>
        Promise.all(
            connections
                .filter(filterByCteCapabilities("enabled"))
                .map(async (connection) => {
                    await connection
                        .getRepository(Foo)
                        .insert(
                            [1, 2, 3].map((i) => ({ id: i, bar: String(i) })),
                        )
                    const cteQuery = connection
                        .createQueryBuilder()
                        .select()
                        .addSelect("bar", "bar")
                        .from(Foo, "foo")
                        .where(`foo.bar = '2'`)

                    // Spanner does not support column names in CTE
                    const cteOptions =
                        connection.driver.options.type === "spanner"
                            ? undefined
                            : {
                                  columnNames: ["raz"],
                              }
                    const cteSelection =
                        connection.driver.options.type === "spanner"
                            ? "qaz.bar"
                            : "qaz.raz"

                    const results = await connection
                        .createQueryBuilder(Foo, "foo")
                        .addCommonTableExpression(cteQuery, "qaz", cteOptions)
                        .innerJoin("qaz", "qaz", `${cteSelection} = foo.bar`)
                        .getMany()

                    expect(results).to.have.length(1)

                    expect(results[0]).to.include({
                        bar: "2",
                    })
                }),
        ))

    it("should allow to use INSERT with RETURNING clause in CTE", () =>
        Promise.all(
            connections
                .filter(filterByCteCapabilities("writable"))
                .map(async (connection) => {
                    const bar = Math.random().toString()
                    const cteQuery = connection
                        .createQueryBuilder()
                        .insert()
                        .into(Foo)
                        .values({
                            id: 7,
                            bar,
                        })
                        .returning(["id", "bar"])

                    const results = await connection
                        .createQueryBuilder()
                        .select()
                        .addCommonTableExpression(cteQuery, "insert_result")
                        .from("insert_result", "insert_result")
                        .getRawMany()

                    expect(results).to.have.length(1)

                    expect(results[0]).to.include({
                        bar,
                    })
                }),
        ))

    it("should allow string for CTE", () =>
        Promise.all(
            connections
                .filter(filterByCteCapabilities("enabled"))
                .map(async (connection) => {
                    // Spanner does not support column names in CTE

                    let results: { row: any }[] = []
                    if (connection.driver.options.type === "spanner") {
                        results = await connection
                            .createQueryBuilder()
                            .select()
                            .addCommonTableExpression(
                                `
                                SELECT 1 AS foo
                                UNION ALL
                                SELECT 2 AS foo
                                `,
                                "cte",
                            )
                            .from("cte", "cte")
                            .addSelect("foo", "row")
                            .getRawMany<{ row: any }>()
                    } else {
                        results = await connection
                            .createQueryBuilder()
                            .select()
                            .addCommonTableExpression(
                                `
                                SELECT 1
                                UNION
                                SELECT 2
                                `,
                                "cte",
                                { columnNames: ["foo"] },
                            )
                            .from("cte", "cte")
                            .addSelect("foo", "row")
                            .getRawMany<{ row: any }>()
                    }

                    const [rowWithOne, rowWithTwo] = results

                    expect(String(rowWithOne.row)).to.equal("1")
                    expect(String(rowWithTwo.row)).to.equal("2")
                }),
        ))
})
