import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Test } from "./entity/Test"
import { filterByCteCapabilities } from "../cte/helpers"
import { expect } from "chai"

describe("query builder > comment", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Test],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should scrub end comment pattern from string", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sql = dataSource.manager
                    .createQueryBuilder(Test, "test")
                    .comment("Hello World */ */")
                    .getSql()

                expect(sql).to.match(/^\/\* Hello World {3}\*\/ /)
            }),
        ))

    it("should not allow an empty comment", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sql = dataSource.manager
                    .createQueryBuilder(Test, "test")
                    .comment("")
                    .getSql()

                expect(sql).to.not.match(/^\/\* Hello World {2}\*\/ /)
            }),
        ))

    it("should allow a comment with just whitespaces", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sql = dataSource.manager
                    .createQueryBuilder(Test, "test")
                    .comment(" ")
                    .getSql()

                expect(sql).to.match(/^\/\* {3}\*\/ /)
            }),
        ))

    it("should allow a multi-line comment", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sql = dataSource.manager
                    .createQueryBuilder(Test, "test")
                    .comment("Hello World\nIt's a beautiful day!")
                    .getSql()

                expect(sql).to.match(
                    /^\/\* Hello World\nIt's a beautiful day! \*\/ /,
                )
            }),
        ))

    it("should include comment in select", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sql = dataSource.manager
                    .createQueryBuilder(Test, "test")
                    .comment("Hello World")
                    .getSql()

                expect(sql).to.match(/^\/\* Hello World \*\/ /)
            }),
        ))

    it("should include comment in update", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sql = dataSource.manager
                    .createQueryBuilder(Test, "test")
                    .update()
                    .set({ id: 2 })
                    .comment("Hello World")
                    .getSql()

                expect(sql).to.match(/^\/\* Hello World \*\/ /)
            }),
        ))

    it("should include comment in insert", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sql = dataSource.manager
                    .createQueryBuilder(Test, "test")
                    .insert()
                    .values({ id: 1 })
                    .comment("Hello World")
                    .getSql()

                expect(sql).to.match(/^\/\* Hello World \*\/ /)
            }),
        ))

    it("should include comment in delete", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const sql = dataSource.manager
                    .createQueryBuilder(Test, "test")
                    .delete()
                    .comment("Hello World")
                    .getSql()

                expect(sql).to.match(/^\/\* Hello World \*\/ /)
            }),
        ))

    // https://github.com/typeorm/typeorm/issues/10207
    it("should not treat parameter-like tokens in the comment as parameters", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const test = new Test()
                await dataSource.manager.save(test)

                const query = dataSource.manager
                    .createQueryBuilder(Test, "test")
                    .where("test.id = :id", { id: test.id })
                const [, expectedParameters] = query.getQueryAndParameters()

                query.comment("route :id")
                const [sql, parameters] = query.getQueryAndParameters()
                expect(sql).to.match(/^\/\* route :id \*\/ /)
                expect(parameters).to.deep.equal(expectedParameters)

                const loaded = await query.getOne()
                expect(loaded).to.exist
            }),
        ))

    it("should not spread array parameters referenced in the comment", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const test = new Test()
                await dataSource.manager.save(test)

                const query = dataSource.manager
                    .createQueryBuilder(Test, "test")
                    .where("test.id IN (:...ids)", { ids: [test.id, -1] })
                const [, expectedParameters] = query.getQueryAndParameters()

                query.comment("ids :...ids")
                const [sql, parameters] = query.getQueryAndParameters()
                expect(sql).to.match(/^\/\* ids :\.\.\.ids \*\/ /)
                expect(parameters).to.deep.equal(expectedParameters)

                const loaded = await query.getMany()
                expect(loaded).to.have.lengthOf(1)
            }),
        ))

    it("should not treat parameter-like tokens in a sub-query comment as parameters", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const test = new Test()
                await dataSource.manager.save(test)

                const createQuery = (comment?: string) =>
                    dataSource.manager
                        .createQueryBuilder()
                        .select("sub.id", "id")
                        .from((qb) => {
                            const subQuery = qb
                                .subQuery()
                                .select("test.id", "id")
                                .from(Test, "test")
                                .where("test.id = :id")
                            return comment
                                ? subQuery.comment(comment)
                                : subQuery
                        }, "sub")
                        .setParameter("id", test.id)
                const [, expectedParameters] =
                    createQuery().getQueryAndParameters()

                const query = createQuery("inner :id")
                const [sql, parameters] = query.getQueryAndParameters()
                expect(sql).to.contain("(/* inner :id */ SELECT")
                expect(parameters).to.deep.equal(expectedParameters)

                const rows = await query.getRawMany()
                expect(rows).to.have.lengthOf(1)
            }),
        ))

    it("should not treat parameter-like tokens in a CTE comment as parameters", () =>
        Promise.all(
            dataSources
                .filter(filterByCteCapabilities("enabled"))
                .map(async (dataSource) => {
                    const test = new Test()
                    await dataSource.manager.save(test)

                    const createQuery = (comment?: string) => {
                        const cte = dataSource.manager
                            .createQueryBuilder()
                            .select("test.id", "id")
                            .from(Test, "test")
                            .where("test.id = :id")
                        return dataSource.manager
                            .createQueryBuilder(Test, "test")
                            .addCommonTableExpression(
                                comment ? cte.comment(comment) : cte,
                                "cte",
                            )
                            .where("test.id IN (SELECT id FROM cte)")
                            .setParameter("id", test.id)
                    }
                    const [, expectedParameters] =
                        createQuery().getQueryAndParameters()

                    const query = createQuery("cte :id")
                    const [sql, parameters] = query.getQueryAndParameters()
                    expect(sql).to.contain("(/* cte :id */ SELECT")
                    expect(parameters).to.deep.equal(expectedParameters)

                    const loaded = await query.getMany()
                    expect(loaded).to.have.lengthOf(1)
                }),
        ))
})
