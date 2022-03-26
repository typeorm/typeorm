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
                        .addSelect(`foo.bar`)
                        .from(Foo, "foo")
                        .where(`foo.bar = :value`, { value: "2" })

                    const qb = await connection
                        .createQueryBuilder()
                        .addCommonTableExpression(cteQuery, "qaz", {
                            columnNames: ["raz"],
                        })
                        .from("qaz", "qaz")
                        .select([])
                        .addSelect("qaz.raz", "raz")

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
                        .addSelect("bar")
                        .from(Foo, "foo")
                        .where(`foo.bar = '2'`)

                    const results = await connection
                        .createQueryBuilder(Foo, "foo")
                        .addCommonTableExpression(cteQuery, "qaz", {
                            columnNames: ["raz"],
                        })
                        .innerJoin("qaz", "qaz", "qaz.raz = foo.bar")
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
                    const results = await connection
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

                    const [rowWithOne, rowWithTwo] = results

                    expect(String(rowWithOne.row)).to.equal("1")
                    expect(String(rowWithTwo.row)).to.equal("2")
                }),
        ))
})
