import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Company } from "./entity/Company"

describe("create comment", () => {
    // GitHub issue #10621 - Table comments not supported by typeorm for SAP HANA
    describe("table comment", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [Company],
                    enabledDrivers: ["sap", "postgres", "mysql", "mariadb"],
                    dropSchema: true,
                    schemaCreate: true,
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        async function loadCommentFromDB(
            dataSource: DataSource,
            tableName: string,
        ) {
            const dbType = dataSource.driver.options.type
            if (dbType === "sap") {
                const res = await dataSource.query(
                    `SELECT "COMMENTS" FROM "SYS"."TABLES" WHERE "TABLE_NAME" = ? AND "SCHEMA_NAME" = 'SYSTEM'`,
                    [tableName],
                )
                return res.length > 0 ? res[0]["COMMENTS"] : undefined
            } else if (dbType === "postgres") {
                const res = await dataSource.query(
                    `SELECT obj_description($1::regclass, 'pg_class') AS "comment"`,
                    [tableName],
                )
                return res.length > 0 ? res[0]["comment"] : undefined
            } else if (dbType === "mysql" || dbType === "mariadb") {
                const res = await dataSource.query(
                    `SELECT \`TABLE_COMMENT\` FROM \`INFORMATION_SCHEMA\`.\`TABLES\` WHERE TABLE_NAME = ?`,
                    [tableName],
                )
                return res.length > 0 ? res[0]["TABLE_COMMENT"] : undefined
            }
            return undefined
        }

        it("should create table with comment", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const tableMetadata = connection.getMetadata(Company)
                    expect(tableMetadata!.comment).to.be.equal(
                        "This is a company entity",
                    )

                    const res = await loadCommentFromDB(
                        connection,
                        tableMetadata.tableName,
                    )
                    expect(res).to.equal("This is a company entity")
                }),
            ))

        it("should update table and remove comment", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    const tableMetadata = connection.getMetadata(Company)
                    expect(tableMetadata!.comment).to.be.equal(
                        "This is a company entity",
                    )

                    // update comment
                    const table = await queryRunner.getTable("company")
                    await queryRunner.changeTableComment(
                        table!,
                        "Updated company entity comment",
                    )

                    expect(table!.comment).to.be.equal(
                        "Updated company entity comment",
                    )

                    const res = await loadCommentFromDB(
                        connection,
                        tableMetadata.tableName,
                    )
                    expect(res).to.equal("Updated company entity comment")

                    // remove comment
                    await queryRunner.changeTableComment(table!, undefined)

                    expect(table!.comment).to.be.undefined

                    const res2 = await loadCommentFromDB(
                        connection,
                        tableMetadata.tableName,
                    )

                    expect(res2).to.be.oneOf([null, ""])
                    await queryRunner.release()
                }),
            ))
        it("should correctly synchronize when table comment changes", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const companyMetadata = connection.getMetadata(Company)
                    expect(companyMetadata!.comment).to.be.equal(
                        "This is a company entity",
                    )

                    companyMetadata.comment =
                        "Synchronized company entity comment"

                    await connection.synchronize()

                    const res = await loadCommentFromDB(
                        connection,
                        companyMetadata.tableName,
                    )
                    expect(res).to.equal("Synchronized company entity comment")
                }),
            ))
    })
})
