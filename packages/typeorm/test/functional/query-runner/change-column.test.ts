import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    createTypeormMetadataTable,
} from "../../utils/test-utils"
import { TableColumn } from "../../../src"
import type { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("query runner > change column", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should correctly change column and revert change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // CockroachDB and Spanner does not allow changing primary columns and renaming constraints
                if (
                    dataSource.driver.options.type === "cockroachdb" ||
                    dataSource.driver.options.type === "spanner"
                )
                    return

                const queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("post")

                const nameColumn = table!.findColumnByName("name")!

                nameColumn!.isUnique.should.be.false
                nameColumn!.default!.should.exist

                const changedNameColumn = nameColumn.clone()
                changedNameColumn.default = undefined
                changedNameColumn.isUnique = true
                changedNameColumn.isNullable = true
                changedNameColumn.length = "500"
                await queryRunner.changeColumn(
                    table!,
                    nameColumn,
                    changedNameColumn,
                )

                table = await queryRunner.getTable("post")
                expect(table!.findColumnByName("name")!.default).to.be.undefined
                table!.findColumnByName("name")!.isUnique.should.be.true
                table!.findColumnByName("name")!.isNullable.should.be.true

                // SQLite does not impose any length restrictions
                if (!DriverUtils.isSQLiteFamily(dataSource.driver)) {
                    table!
                        .findColumnByName("name")!
                        .length!.should.be.equal("500")
                }

                const textColumn = table!.findColumnByName("text")!
                const changedTextColumn = textColumn.clone()
                changedTextColumn.name = "description"
                changedTextColumn.isPrimary = true
                changedTextColumn.default = "'default text'"
                await queryRunner.changeColumn(
                    table!,
                    textColumn,
                    changedTextColumn,
                )

                // column name was changed to 'description'
                table = await queryRunner.getTable("post")
                table!.findColumnByName("description")!.isPrimary.should.be.true
                table!.findColumnByName("description")!.default!.should.exist

                const idColumn = table!.findColumnByName("id")!
                const changedIdColumn = idColumn.clone()
                changedIdColumn!.isPrimary = false
                await queryRunner.changeColumn(
                    table!,
                    idColumn,
                    changedIdColumn,
                )

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isPrimary.should.be.false

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isPrimary.should.be.true
                table!.findColumnByName("name")!.default!.should.exist
                table!.findColumnByName("name")!.isUnique.should.be.false
                table!.findColumnByName("name")!.isNullable.should.be.false
                table!.findColumnByName("text")!.isPrimary.should.be.false
                expect(table!.findColumnByName("text")!.default).to.be.undefined

                await queryRunner.release()
            }),
        ))

    it("should correctly change column 'isGenerated' property and revert change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // CockroachDB and Spanner does not allow changing generated columns in existent tables
                if (
                    dataSource.driver.options.type === "cockroachdb" ||
                    dataSource.driver.options.type === "spanner"
                )
                    return

                const queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("post")
                let idColumn = table!.findColumnByName("id")!
                let changedIdColumn = idColumn.clone()

                changedIdColumn.isGenerated = true
                changedIdColumn.generationStrategy = "increment"
                await queryRunner.changeColumn(
                    table!,
                    idColumn,
                    changedIdColumn,
                )

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isGenerated.should.be.true
                table!
                    .findColumnByName("id")!
                    .generationStrategy!.should.be.equal("increment")

                await queryRunner.executeMemoryDownSql()
                queryRunner.clearSqlMemory()

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isGenerated.should.be.false
                expect(table!.findColumnByName("id")!.generationStrategy).to.be
                    .undefined

                table = await queryRunner.getTable("post")
                idColumn = table!.findColumnByName("id")!
                changedIdColumn = idColumn.clone()
                changedIdColumn.isPrimary = false
                await queryRunner.changeColumn(
                    table!,
                    idColumn,
                    changedIdColumn,
                )

                // check case when both primary and generated properties set to true
                table = await queryRunner.getTable("post")
                idColumn = table!.findColumnByName("id")!
                changedIdColumn = idColumn.clone()
                changedIdColumn.isPrimary = true
                changedIdColumn.isGenerated = true
                changedIdColumn.generationStrategy = "increment"
                await queryRunner.changeColumn(
                    table!,
                    idColumn,
                    changedIdColumn,
                )

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isGenerated.should.be.true
                table!
                    .findColumnByName("id")!
                    .generationStrategy!.should.be.equal("increment")

                await queryRunner.executeMemoryDownSql()
                queryRunner.clearSqlMemory()

                table = await queryRunner.getTable("post")
                table!.findColumnByName("id")!.isGenerated.should.be.false
                expect(table!.findColumnByName("id")!.generationStrategy).to.be
                    .undefined

                await queryRunner.release()
            }),
        ))

    it("should correctly change generated as expression", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const isPostgres = dataSource.driver.options.type === "postgres"
                const isSpanner = dataSource.driver.options.type === "spanner"
                const shouldRun =
                    (isPostgres &&
                        (dataSource.driver as PostgresDriver)
                            .isGeneratedColumnsSupported) ||
                    isSpanner
                if (!shouldRun) return

                const queryRunner = dataSource.createQueryRunner()

                await createTypeormMetadataTable(dataSource.driver, queryRunner)

                // Database is running < postgres 12
                if (
                    !(dataSource.driver as PostgresDriver)
                        .isGeneratedColumnsSupported
                )
                    return

                let generatedColumn = new TableColumn({
                    name: "generated",
                    type: isSpanner ? "string" : "varchar",
                    generatedType: "STORED",
                    asExpression: "text || tag",
                })

                let table = await queryRunner.getTable("post")

                await queryRunner.addColumn(table!, generatedColumn)

                table = await queryRunner.getTable("post")

                generatedColumn = table!.findColumnByName("generated")!
                generatedColumn!.generatedType!.should.be.equals("STORED")
                generatedColumn!.asExpression!.should.be.equals("text || tag")

                let changedGeneratedColumn = generatedColumn.clone()
                changedGeneratedColumn.asExpression = "text || tag || name"

                await queryRunner.changeColumn(
                    table!,
                    generatedColumn,
                    changedGeneratedColumn,
                )

                table = await queryRunner.getTable("post")
                generatedColumn = table!.findColumnByName("generated")!
                generatedColumn!.generatedType!.should.be.equals("STORED")
                generatedColumn!.asExpression!.should.be.equals(
                    "text || tag || name",
                )

                changedGeneratedColumn = generatedColumn.clone()
                delete changedGeneratedColumn.generatedType
                await queryRunner.changeColumn(
                    table!,
                    generatedColumn,
                    changedGeneratedColumn,
                )

                table = await queryRunner.getTable("post")
                generatedColumn = table!.findColumnByName("generated")!
                generatedColumn!.should.not.haveOwnProperty("generatedType")
                generatedColumn!.should.not.haveOwnProperty("asExpression")

                changedGeneratedColumn = generatedColumn.clone()
                changedGeneratedColumn.asExpression = "text || tag || name"
                changedGeneratedColumn.generatedType = "STORED"
                await queryRunner.changeColumn(
                    table!,
                    generatedColumn,
                    changedGeneratedColumn,
                )

                table = await queryRunner.getTable("post")
                generatedColumn = table!.findColumnByName("generated")!
                generatedColumn!.generatedType!.should.be.equals("STORED")
                generatedColumn!.asExpression!.should.be.equals(
                    "text || tag || name",
                )
            }),
        ))

    // https://github.com/typeorm/typeorm/issues/3357
    it("should not lose data or skip other pending changes when only widening a Postgres varchar column's length", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type !== "postgres") return

                const queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("post")

                // a column with an explicit length, isolated from the other
                // columns on "post" so this test does not depend on schema
                // changes made by other tests in this file
                const extraColumn = new TableColumn({
                    name: "extra",
                    type: "character varying",
                    length: "50",
                    isNullable: false,
                })
                await queryRunner.addColumn(table!, extraColumn)

                await queryRunner.query(
                    `INSERT INTO "post"("id", "version", "name", "text", "tag", "extra") VALUES (1, 1, 'n', 't', 'tg', 'existing value')`,
                )

                table = await queryRunner.getTable("post")
                const oldExtraColumn = table!.findColumnByName("extra")!

                // widen the length AND change other properties in the same
                // call, mirroring how a single entity change is applied -
                // all of it must take effect, not just the length change
                const widenedColumn = oldExtraColumn.clone()
                widenedColumn.length = "150"
                widenedColumn.isNullable = true
                widenedColumn.default = "'fallback'"
                widenedColumn.comment = "widened field"
                await queryRunner.changeColumn(
                    table!,
                    oldExtraColumn,
                    widenedColumn,
                )

                table = await queryRunner.getTable("post")
                const changedColumn = table!.findColumnByName("extra")!
                changedColumn.length!.should.be.equal("150")
                changedColumn.isNullable.should.be.true
                expect(changedColumn.default).to.exist
                changedColumn.comment!.should.be.equal("widened field")

                const rows = await queryRunner.query(
                    `SELECT "extra" FROM "post" WHERE "id" = 1`,
                )
                rows[0].extra.should.be.equal("existing value")

                await queryRunner.release()
            }),
        ))

    // https://github.com/typeorm/typeorm/issues/3357
    it("should not lose data when widening a Postgres varchar column to unbounded", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type !== "postgres") return

                const queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("post")

                const boundedColumn = new TableColumn({
                    name: "unbounded_target",
                    type: "character varying",
                    length: "50",
                    isNullable: false,
                })
                await queryRunner.addColumn(table!, boundedColumn)

                await queryRunner.query(
                    `INSERT INTO "post"("id", "version", "name", "text", "tag", "unbounded_target") VALUES (2, 1, 'n', 't', 'tg', 'existing value')`,
                )

                table = await queryRunner.getTable("post")
                const oldColumn = table!.findColumnByName("unbounded_target")!

                const unboundedColumn = oldColumn.clone()
                unboundedColumn.length = ""
                await queryRunner.changeColumn(
                    table!,
                    oldColumn,
                    unboundedColumn,
                )

                table = await queryRunner.getTable("post")
                const changedColumn =
                    table!.findColumnByName("unbounded_target")!
                expect(changedColumn.length).to.be.oneOf([undefined, ""])

                const rows = await queryRunner.query(
                    `SELECT "unbounded_target" FROM "post" WHERE "id" = 2`,
                )
                rows[0].unbounded_target.should.be.equal("existing value")

                await queryRunner.release()
            }),
        ))

    // https://github.com/typeorm/typeorm/issues/3357
    it("should not drop the widened length when also changing collation on a Postgres varchar column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type !== "postgres") return

                const queryRunner = dataSource.createQueryRunner()
                let table = await queryRunner.getTable("post")

                const collatedColumn = new TableColumn({
                    name: "collated_target",
                    type: "character varying",
                    length: "50",
                    collation: "POSIX",
                    isNullable: false,
                })
                await queryRunner.addColumn(table!, collatedColumn)

                table = await queryRunner.getTable("post")
                const oldColumn = table!.findColumnByName("collated_target")!

                const changedColumn = oldColumn.clone()
                changedColumn.length = "150"
                changedColumn.collation = "C"
                await queryRunner.changeColumn(table!, oldColumn, changedColumn)

                table = await queryRunner.getTable("post")
                const resultColumn = table!.findColumnByName("collated_target")!
                resultColumn.length!.should.be.equal("150")
                resultColumn.collation!.should.be.equal("C")

                await queryRunner.release()
            }),
        ))

    // https://github.com/typeorm/typeorm/issues/3357
    it("should recreate rather than in-place alter a stored generated Postgres column when widening its length", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const isPostgres = dataSource.driver.options.type === "postgres"
                if (!isPostgres) return
                if (
                    !(dataSource.driver as PostgresDriver)
                        .isGeneratedColumnsSupported
                )
                    return

                const queryRunner = dataSource.createQueryRunner()

                await createTypeormMetadataTable(dataSource.driver, queryRunner)

                let table = await queryRunner.getTable("post")

                let generatedColumn = new TableColumn({
                    name: "generated_widen",
                    type: "varchar",
                    length: "50",
                    generatedType: "STORED",
                    asExpression: "text || tag",
                })
                await queryRunner.addColumn(table!, generatedColumn)

                table = await queryRunner.getTable("post")
                generatedColumn = table!.findColumnByName("generated_widen")!

                const widenedGeneratedColumn = generatedColumn.clone()
                widenedGeneratedColumn.length = "100"

                // this must not throw - Postgres rejects `ALTER COLUMN ... TYPE`
                // on stored generated columns, so widening must go through
                // drop-and-recreate instead of the in-place path
                await queryRunner.changeColumn(
                    table!,
                    generatedColumn,
                    widenedGeneratedColumn,
                )

                table = await queryRunner.getTable("post")
                const resultColumn = table!.findColumnByName("generated_widen")!
                resultColumn.length!.should.be.equal("100")
                resultColumn.generatedType!.should.be.equal("STORED")

                await queryRunner.release()
            }),
        ))
})
