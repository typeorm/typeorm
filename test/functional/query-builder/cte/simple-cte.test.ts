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
import "reflect-metadata"

import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Foo } from "./entity/foo"
import { filterByCteCapabilities } from "./helpers"

describe("query builder > cte > simple", () => {
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

    it("show allow select from CTE", () =>
        Promise.all(
            dataSources
                .filter(filterByCteCapabilities("enabled"))
                .map(async (dataSource) => {
                    await dataSource
                        .getRepository(Foo)
                        .insert(
                            [1, 2, 3].map((i) => ({ id: i, bar: String(i) })),
                        )

                    const cteSelection = `${dataSource.driver.escape(
                        "foo",
                    )}.${dataSource.driver.escape("bar")}`
                    const cteQuery = dataSource
                        .createQueryBuilder()
                        .select(cteSelection, "bar")
                        .from(Foo, "foo")
                        .where(`${cteSelection} = :value`, { value: "2" })

                    // Spanner does not support column names in CTE
                    const cteOptions =
                        dataSource.driver.options.type === "spanner"
                            ? undefined
                            : {
                                  columnNames: ["raz"],
                              }

                    const selection =
                        dataSource.driver.options.type === "spanner"
                            ? '"qaz"."bar"'
                            : `${dataSource.driver.escape(
                                  "qaz",
                              )}.${dataSource.driver.escape("raz")}`

                    const qb = dataSource
                        .createQueryBuilder()
                        .addCommonTableExpression(cteQuery, "qaz", cteOptions)
                        .select(selection, "raz")
                        .from("qaz", "qaz")

                    expect(await qb.getRawMany()).to.deep.equal([{ raz: "2" }])
                }),
        ))

    it("should allow join with CTE", () =>
        Promise.all(
            dataSources
                .filter(filterByCteCapabilities("enabled"))
                .map(async (dataSource) => {
                    await dataSource
                        .getRepository(Foo)
                        .insert(
                            [1, 2, 3].map((i) => ({ id: i, bar: String(i) })),
                        )

                    const cteSelection = `${dataSource.driver.escape(
                        "foo",
                    )}.${dataSource.driver.escape("bar")}`

                    const cteQuery = dataSource
                        .createQueryBuilder()
                        .select(cteSelection, "bar")
                        .from(Foo, "foo")
                        .where(`${cteSelection} = '2'`)

                    // Spanner does not support column names in CTE
                    const cteOptions =
                        dataSource.driver.options.type === "spanner"
                            ? undefined
                            : {
                                  columnNames: ["raz"],
                              }

                    const selection =
                        dataSource.driver.options.type === "spanner"
                            ? '"qaz"."bar"'
                            : `${dataSource.driver.escape(
                                  "qaz",
                              )}.${dataSource.driver.escape("raz")}`

                    const results = await dataSource
                        .createQueryBuilder(Foo, "foo")
                        .addCommonTableExpression(cteQuery, "qaz", cteOptions)
                        .innerJoin(
                            "qaz",
                            "qaz",
                            `${selection} = ${cteSelection}`,
                        )
                        .getMany()

                    expect(results).to.have.length(1)

                    expect(results[0]).to.include({
                        bar: "2",
                    })
                }),
        ))

    it("should allow to use INSERT with RETURNING clause in CTE", () =>
        Promise.all(
            dataSources
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
            dataSources
                .filter(filterByCteCapabilities("enabled"))
                .map(async (dataSource) => {
                    let results: { row: number }[]
                    if (dataSource.options.type === "spanner") {
                        // Spanner does not support column names in CTE
                        const query1 = dataSource
                            .createQueryBuilder()
                            .select("1", "foo")
                            .fromDummy()
                            .getSql()
                        const query2 = dataSource
                            .createQueryBuilder()
                            .select("2", "foo")
                            .fromDummy()
                            .getSql()

                        results = await dataSource
                            .createQueryBuilder()
                            .addCommonTableExpression(
                                `${query1} UNION ALL ${query2}`,
                                "cte",
                            )
                            .select('"foo"', "row")
                            .from("cte", "cte")
                            .getRawMany<{ row: number }>()
                    } else {
                        const query1 = dataSource
                            .createQueryBuilder()
                            .select("1")
                            .fromDummy()
                            .getSql()
                        const query2 = dataSource
                            .createQueryBuilder()
                            .select("2")
                            .fromDummy()
                            .getSql()

                        const columnName = dataSource.driver.escape("foo")
                        results = await dataSource
                            .createQueryBuilder()
                            .addCommonTableExpression(
                                `${query1} UNION ${query2}`,
                                "cte",
                                { columnNames: ["foo"] },
                            )
                            .select(columnName, "row")
                            .from("cte", "cte")
                            .orderBy(columnName)
                            .getRawMany<{ row: number }>()
                    }

                    const [rowWithOne, rowWithTwo] = results

                    expect(String(rowWithOne.row)).to.equal("1")
                    expect(String(rowWithTwo.row)).to.equal("2")
                }),
        ))
})
