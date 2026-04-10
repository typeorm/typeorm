import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { expect } from "chai"
import { Post } from "./entity/Post"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("github issues > #12333 SQL injection in QueryBuilder useIndex and setLock lockTables", () => {
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

    it("should escape special characters in useIndex parameter", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isMySQLFamily(dataSource.driver)) {
                    return
                }

                const sql = dataSource
                    .createQueryBuilder(Post, "post")
                    .useIndex("idx`) WHERE 1=1; DROP TABLE post; --")
                    .getSql()

                // The index name should be escaped/quoted, preventing SQL injection
                expect(sql).to.not.contain("DROP TABLE")
                expect(sql).to.contain("USE INDEX (")
                // The backtick in the malicious input should be escaped
                expect(sql).to.not.contain(
                    "USE INDEX (idx`) WHERE 1=1; DROP TABLE post; --)",
                )
            }),
        ))

    it("should properly quote normal index names in useIndex", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isMySQLFamily(dataSource.driver)) {
                    return
                }

                const sql = dataSource
                    .createQueryBuilder(Post, "post")
                    .useIndex("IDX_title")
                    .getSql()

                expect(sql).to.contain("USE INDEX (`IDX_title`)")
            }),
        ))

    it("should escape special characters in lockTables parameter", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                const sql = dataSource.manager.transaction(
                    async (entityManager) => {
                        const qb = entityManager
                            .createQueryBuilder(Post, "post")
                            .setLock("pessimistic_write", undefined, [
                                'post"; DROP TABLE post; --',
                            ])

                        const generatedSql = qb.getSql()

                        // The table name should be escaped/quoted, preventing SQL injection
                        expect(generatedSql).to.not.contain("DROP TABLE")
                        expect(generatedSql).to.contain("OF ")
                        // The double-quote in the malicious input should be escaped
                        expect(generatedSql).to.not.contain(
                            'OF post"; DROP TABLE post; --',
                        )

                        return generatedSql
                    },
                )
            }),
        ))

    it("should properly quote normal table names in lockTables", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                    return
                }

                await dataSource.manager.transaction(
                    async (entityManager) => {
                        const sql = entityManager
                            .createQueryBuilder(Post, "post")
                            .setLock("pessimistic_write", undefined, [
                                "post",
                            ])
                            .getSql()

                        expect(sql).to.contain('OF "post"')
                    },
                )
            }),
        ))
})
