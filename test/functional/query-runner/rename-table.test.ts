import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../src/data-source/DataSource"
import { DriverUtils } from "../../../src/driver/DriverUtils"
import type { QueryRunner } from "../../../src/query-runner/QueryRunner"
import { Table } from "../../../src/schema-builder/table/Table"
import { TableIndex } from "../../../src/schema-builder/table/TableIndex"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Category } from "./entity/rename-table/Category"
import { CircleReport } from "./entity/rename-table/CircleReport"
import { Report } from "./entity/rename-table/Report"

describe("query runner > rename table", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly rename table and revert rename", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // CockroachDB and Spanner does not support renaming constraints and removing PK.
                if (
                    dataSource.driver.options.type === "cockroachdb" ||
                    dataSource.driver.options.type === "spanner"
                ) {
                    return
                }

                const queryRunner = dataSource.createQueryRunner()

                const sequenceQuery = (name: string) => {
                    return `SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema = 'public' and sequence_name = '${name}'`
                }

                // check if sequence "faculty_id_seq" exist
                if (dataSource.driver.options.type === "postgres") {
                    const facultySeq = await queryRunner.query(
                        sequenceQuery("faculty_id_seq"),
                    )
                    expect(facultySeq[0].count).to.equal("1")
                }

                let table = await queryRunner.getTable("faculty")

                await queryRunner.renameTable(table!, "question")
                table = await queryRunner.getTable("question")
                expect(table).to.exist

                // check if sequence "faculty_id_seq" was renamed to "question_id_seq"
                if (dataSource.driver.options.type === "postgres") {
                    const facultySeq = await queryRunner.query(
                        sequenceQuery("faculty_id_seq"),
                    )
                    const questionSeq = await queryRunner.query(
                        sequenceQuery("question_id_seq"),
                    )
                    expect(facultySeq[0].count).to.equal("0")
                    expect(questionSeq[0].count).to.equal("1")
                }

                await queryRunner.renameTable("question", "answer")
                table = await queryRunner.getTable("answer")
                expect(table).to.exist

                // check if sequence "question_id_seq" was renamed to "answer_id_seq"
                if (dataSource.driver.options.type === "postgres") {
                    const questionSeq = await queryRunner.query(
                        sequenceQuery("question_id_seq"),
                    )
                    const answerSeq = await queryRunner.query(
                        sequenceQuery("answer_id_seq"),
                    )
                    expect(questionSeq[0].count).to.equal("0")
                    expect(answerSeq[0].count).to.equal("1")
                }

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("faculty")
                expect(table).to.exist

                // check if sequence "answer_id_seq" was renamed to "faculty_id_seq"
                if (dataSource.driver.options.type === "postgres") {
                    const answerSeq = await queryRunner.query(
                        sequenceQuery("answer_id_seq"),
                    )
                    const facultySeq = await queryRunner.query(
                        sequenceQuery("faculty_id_seq"),
                    )
                    expect(answerSeq[0].count).to.equal("0")
                    expect(facultySeq[0].count).to.equal("1")
                }

                await queryRunner.release()
            }),
        ))

    it("should correctly rename table with all constraints depend to that table and revert rename", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // CockroachDB and Spanner does not support renaming constraints and removing PK.
                if (
                    dataSource.driver.options.type === "cockroachdb" ||
                    dataSource.driver.options.type === "spanner"
                ) {
                    return
                }

                const queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")

                await queryRunner.renameTable(table!, "renamedPost")
                table = await queryRunner.getTable("renamedPost")
                expect(table).to.exist

                // should successfully drop pk if pk constraint was correctly renamed.
                await queryRunner.dropPrimaryKey(table!)

                // MySql does not support unique constraints
                if (
                    !DriverUtils.isMySQLFamily(dataSource.driver) &&
                    !(dataSource.driver.options.type === "sap")
                ) {
                    const newUniqueConstraintName =
                        dataSource.namingStrategy.uniqueConstraintName(table!, [
                            "text",
                            "tag",
                        ])
                    const tableUnique = table!.uniques.find((unique) => {
                        return !!unique.columnNames.find(
                            (columnName) => columnName === "tag",
                        )
                    })
                    expect(tableUnique!.name).to.equal(newUniqueConstraintName)
                }

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")
                expect(table).to.exist

                await queryRunner.release()
            }),
        ))

    it("should correctly rename table with custom schema and database and all its dependencies and revert rename", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // CockroachDB and Spanner does not support renaming constraints and removing PK.
                if (
                    dataSource.driver.options.type === "cockroachdb" ||
                    dataSource.driver.options.type === "spanner"
                ) {
                    return
                }

                const queryRunner = dataSource.createQueryRunner()
                let table: Table | undefined

                let questionTableName: string = "question"
                let renamedQuestionTableName: string = "renamedQuestion"
                let categoryTableName: string = "category"
                let renamedCategoryTableName: string = "renamedCategory"

                // create different names to test renaming with custom schema and database.
                if (dataSource.driver.options.type === "mssql") {
                    questionTableName = "testDB.testSchema.question"
                    renamedQuestionTableName =
                        "testDB.testSchema.renamedQuestion"
                    categoryTableName = "testDB.testSchema.category"
                    renamedCategoryTableName =
                        "testDB.testSchema.renamedCategory"
                    await queryRunner.createDatabase("testDB", true)
                    await queryRunner.createSchema("testDB.testSchema", true)
                } else if (
                    dataSource.driver.options.type === "postgres" ||
                    dataSource.driver.options.type === "sap"
                ) {
                    questionTableName = "testSchema.question"
                    renamedQuestionTableName = "testSchema.renamedQuestion"
                    categoryTableName = "testSchema.category"
                    renamedCategoryTableName = "testSchema.renamedCategory"
                    await queryRunner.createSchema("testSchema", true)
                } else if (DriverUtils.isMySQLFamily(dataSource.driver)) {
                    questionTableName = "testDB.question"
                    renamedQuestionTableName = "testDB.renamedQuestion"
                    categoryTableName = "testDB.category"
                    renamedCategoryTableName = "testDB.renamedCategory"
                    await queryRunner.createDatabase("testDB", true)
                }

                await queryRunner.createTable(
                    new Table({
                        name: questionTableName,
                        columns: [
                            {
                                name: "id",
                                type: DriverUtils.isSQLiteFamily(
                                    dataSource.driver,
                                )
                                    ? "integer"
                                    : "int",
                                isPrimary: true,
                                isGenerated: true,
                                generationStrategy: "increment",
                            },
                            {
                                name: "name",
                                type: "varchar",
                            },
                        ],
                        indices: [{ columnNames: ["name"] }],
                    }),
                    true,
                )

                await queryRunner.createTable(
                    new Table({
                        name: categoryTableName,
                        columns: [
                            {
                                name: "id",
                                type: DriverUtils.isSQLiteFamily(
                                    dataSource.driver,
                                )
                                    ? "integer"
                                    : "int",
                                isPrimary: true,
                                isGenerated: true,
                                generationStrategy: "increment",
                            },
                            {
                                name: "questionId",
                                type: "int",
                                isUnique: true,
                            },
                        ],
                        foreignKeys: [
                            {
                                columnNames: ["questionId"],
                                referencedTableName: questionTableName,
                                referencedColumnNames: ["id"],
                            },
                        ],
                    }),
                    true,
                )

                // clear sqls in memory to avoid removing tables when down queries executed.
                queryRunner.clearSqlMemory()

                await queryRunner.renameTable(
                    questionTableName,
                    "renamedQuestion",
                )
                table = await queryRunner.getTable(renamedQuestionTableName)
                const newIndexName = dataSource.namingStrategy.indexName(
                    table!,
                    ["name"],
                )
                expect(table!.indices[0].name).to.equal(newIndexName)

                await queryRunner.renameTable(
                    categoryTableName,
                    "renamedCategory",
                )
                table = await queryRunner.getTable(renamedCategoryTableName)
                const newForeignKeyName =
                    dataSource.namingStrategy.foreignKeyName(
                        table!,
                        ["questionId"],
                        "question",
                        ["id"],
                    )
                expect(table!.foreignKeys[0].name).to.equal(newForeignKeyName)

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable(questionTableName)
                expect(table).to.exist

                table = await queryRunner.getTable(categoryTableName)
                expect(table).to.exist

                await queryRunner.release()
            }),
        ))
})

describe("query runner > rename table > MySQL foreign key indexes", () => {
    let dataSources: DataSource[]

    before(async () => {
        const oldDataSources = await createTestingConnections({
            enabledDrivers: ["mysql", "mariadb"],
            entities: [Category, Report],
            schemaCreate: true,
            dropSchema: true,
        })

        try {
            await Promise.all(
                oldDataSources.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()

                    try {
                        const table = await queryRunner.getTable("reports")
                        const foreignKey = table!.foreignKeys.find(
                            (candidate) =>
                                candidate.columnNames.length === 1 &&
                                candidate.columnNames[0] === "categoryId",
                        )!

                        await queryRunner.dropForeignKey(table!, foreignKey)
                        await queryRunner.query(
                            `DROP INDEX \`${foreignKey.name}\` ON \`reports\``,
                        )
                        await queryRunner.createIndex(
                            table!,
                            new TableIndex({
                                name: foreignKey.name,
                                columnNames: foreignKey.columnNames,
                            }),
                        )
                        await queryRunner.createForeignKey(table!, foreignKey)
                    } finally {
                        await queryRunner.release()
                    }
                }),
            )
        } finally {
            await closeTestingConnections(oldDataSources)
        }

        dataSources = await createTestingConnections({
            enabledDrivers: ["mysql", "mariadb"],
            entities: [Category, CircleReport],
        })
    })

    after(() => closeTestingConnections(dataSources))

    // Regression test for https://github.com/typeorm/typeorm/issues/12671
    it("keeps generated foreign key indexes aligned after a table rename", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let queryRunner: QueryRunner | undefined
                let reloadQueryRunner: QueryRunner | undefined
                let downQueryRunner: QueryRunner | undefined
                let releaseError: unknown
                let releaseFailed = false

                try {
                    queryRunner = dataSource.createQueryRunner()
                    const oldTable = await queryRunner.getTable("reports")
                    expect(oldTable).to.exist

                    const oldForeignKeyNames = oldTable!.foreignKeys.map(
                        (foreignKey) => foreignKey.name,
                    )
                    const oldImplicitForeignKey = oldTable!.foreignKeys.find(
                        (foreignKey) =>
                            foreignKey.columnNames.length === 1 &&
                            foreignKey.columnNames[0] === "categoryId",
                    )!
                    expect(oldForeignKeyNames).to.have.length(2)
                    expect(
                        oldTable!.indices.map((index) => index.name),
                    ).to.include("IDX_12671_custom_covering")

                    queryRunner.clearSqlMemory()
                    await queryRunner.renameTable(oldTable!, "circle_reports")

                    reloadQueryRunner = dataSource.createQueryRunner()
                    const renamedTable =
                        await reloadQueryRunner.getTable("circle_reports")
                    expect(renamedTable).to.exist

                    const metadata = dataSource.getMetadata(CircleReport)
                    const newForeignKeyNames = metadata.foreignKeys.map(
                        (foreignKey) => foreignKey.name,
                    )
                    expect(
                        renamedTable!.foreignKeys.map(
                            (foreignKey) => foreignKey.name,
                        ),
                    ).to.have.members(newForeignKeyNames)

                    const implicitForeignKey = metadata.foreignKeys.find(
                        (foreignKey) =>
                            foreignKey.columnNames.length === 1 &&
                            foreignKey.columnNames[0] === "categoryId",
                    )!
                    const coveringIndexForeignKey = metadata.foreignKeys.find(
                        (foreignKey) =>
                            foreignKey.columnNames.length === 1 &&
                            foreignKey.columnNames[0] === "indexedCategoryId",
                    )!
                    const databaseIndices: { Key_name: string }[] =
                        await reloadQueryRunner.query(
                            "SHOW INDEX FROM `circle_reports`",
                        )
                    const databaseIndexNames = databaseIndices.map(
                        (index) => index.Key_name,
                    )
                    expect(databaseIndexNames).to.include(
                        "IDX_12671_custom_covering",
                    )
                    expect(databaseIndexNames).not.to.include(
                        coveringIndexForeignKey.name,
                    )

                    await reloadQueryRunner.query(
                        "INSERT INTO `issue_12671_categories` (`id`) VALUES (1)",
                    )
                    await reloadQueryRunner.query(
                        "INSERT INTO `circle_reports` (`categoryId`, `indexedCategoryId`, `note`) VALUES (1, 1, 'valid')",
                    )

                    const schemaLog = await dataSource.driver
                        .createSchemaBuilder()
                        .log()
                    expect(
                        schemaLog.upQueries.some((query) =>
                            query.query.includes("DROP INDEX"),
                        ),
                    ).to.be.false
                    expect(schemaLog.upQueries).to.be.empty
                    expect(databaseIndexNames).to.include(
                        implicitForeignKey.name,
                    )

                    await queryRunner.executeMemoryDownSql()

                    downQueryRunner = dataSource.createQueryRunner()
                    expect(await downQueryRunner.hasTable("circle_reports")).to
                        .be.false
                    const revertedTable =
                        await downQueryRunner.getTable("reports")
                    expect(revertedTable).to.exist
                    expect(
                        revertedTable!.foreignKeys.map(
                            (foreignKey) => foreignKey.name,
                        ),
                    ).to.have.members(oldForeignKeyNames)
                    expect(
                        revertedTable!.indices.map((index) => index.name),
                    ).to.include("IDX_12671_custom_covering")
                    const revertedDatabaseIndices: { Key_name: string }[] =
                        await downQueryRunner.query("SHOW INDEX FROM `reports`")
                    const revertedDatabaseIndexNames =
                        revertedDatabaseIndices.map((index) => index.Key_name)
                    expect(revertedDatabaseIndexNames).to.include(
                        oldImplicitForeignKey.name,
                    )
                    expect(revertedDatabaseIndexNames).not.to.include(
                        implicitForeignKey.name,
                    )
                } finally {
                    const releaseResults = await Promise.allSettled(
                        [downQueryRunner, reloadQueryRunner, queryRunner]
                            .filter((runner): runner is QueryRunner => !!runner)
                            .map((runner) => runner.release()),
                    )

                    for (const releaseResult of releaseResults) {
                        if (
                            releaseResult.status === "rejected" &&
                            !releaseFailed
                        ) {
                            releaseFailed = true
                            releaseError = releaseResult.reason
                        }
                    }
                }

                if (releaseFailed) {
                    throw releaseError
                }
            }),
        ))
})
