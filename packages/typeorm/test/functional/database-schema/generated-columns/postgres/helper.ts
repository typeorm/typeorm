import { expect } from "chai"
import type {
    QueryRunner,
    Table,
    TableColumn,
    TypeORMError,
} from "../../../../../src"
import type { PostgresDriver } from "../../../../../src/driver/postgres/PostgresDriver"

export const checkGeneratedColumn = (
    table: Table,
    columnName: string,
    asExpression: string,
    generatedType: "STORED" | "VIRTUAL",
) => {
    const column = table!.findColumnByName(columnName)!
    column.should.be.exist
    column!.generatedType!.should.be.equal(generatedType)
    column!.asExpression!.should.be.equal(asExpression)
}

export const addAndRevert = async (
    queryRunner: QueryRunner,
    table: Table | undefined,
    tableName: string,
    tableColumn: TableColumn,
) => {
    await queryRunner.addColumn(table!, tableColumn)

    table = await queryRunner.getTable(tableName)

    const addedColumn = table!.findColumnByName(tableColumn.name)!
    addedColumn.should.be.exist
    addedColumn!.generatedType!.should.be.equal(tableColumn.generatedType)
    addedColumn!.asExpression!.should.be.equal(tableColumn.asExpression)

    // revert changes
    await queryRunner.executeMemoryDownSql()
    queryRunner.clearSqlMemory()

    table = await queryRunner.getTable(tableName)
    expect(table!.findColumnByName(tableColumn.name)).to.be.undefined

    // check if generated column records removed from typeorm_metadata table
    const metadataRecords = await queryRunner.query(
        `SELECT * FROM "typeorm_metadata" WHERE "table" = '${tableName}' AND "name" = '${tableColumn.name}'`,
    )
    metadataRecords.length.should.be.equal(0)
}

export const dropAndRevert = async (
    queryRunner: QueryRunner,
    table: Table | undefined,
    tableName: string,
    columnName: string,
    generatedType: "STORED" | "VIRTUAL",
    originalExpression: string,
) => {
    await queryRunner.dropColumn(table!, columnName)

    table = await queryRunner.getTable(tableName)
    expect(table!.findColumnByName(columnName)).to.be.undefined

    // check if generated column records removed from typeorm_metadata table
    const metadataRecords = await queryRunner.query(
        `SELECT * FROM "typeorm_metadata" WHERE "table" = '${tableName}' AND "name" = '${columnName}'`,
    )
    metadataRecords.length.should.be.equal(0)

    // revert changes
    await queryRunner.executeMemoryDownSql()
    queryRunner.clearSqlMemory()

    table = await queryRunner.getTable(tableName)

    const revertedColumn = table!.findColumnByName(columnName)!
    revertedColumn.should.be.exist
    revertedColumn!.generatedType!.should.be.equal(generatedType)
    revertedColumn!.asExpression!.should.be.equal(originalExpression)
}

export const changeAndRevert = async (
    table: Table | undefined,
    tableName: string,
    queryRunner: QueryRunner,
    columnName: string,
    newAsExpression: string,
    isBelowVersion17: boolean,
) => {
    const column = table!.findColumnByName(columnName)!
    const changedColumn = column.clone()
    changedColumn.asExpression = newAsExpression

    await queryRunner.changeColumn(table!, column, changedColumn)

    table = await queryRunner.getTable(tableName)

    const changedColumnFromDb = table!.findColumnByName(columnName)!
    changedColumnFromDb.should.be.exist
    changedColumnFromDb!.asExpression!.should.be.equal(newAsExpression)

    const upQueries = queryRunner.getMemorySql().upQueries
    const downQueries = queryRunner.getMemorySql().downQueries

    if (isBelowVersion17 || column.generatedType === "VIRTUAL") {
        const dropQuery = upQueries.find((query) =>
            query.query.includes("ALTER TABLE"),
        )
        dropQuery!.should.be.exist
        dropQuery!.query.should.be.contains(`DROP COLUMN "${columnName}"`)
        const addQuery = downQueries.find((query) =>
            query.query.includes("ALTER TABLE"),
        )
        addQuery!.should.be.exist
        addQuery!.query.should.be.contains(`ADD "${columnName}"`)
    } else {
        const setExpressionQuery = upQueries.find((query) =>
            query.query.includes("ALTER TABLE"),
        )
        setExpressionQuery!.should.be.exist
        setExpressionQuery!.query.should.be.contains(
            `ALTER COLUMN "${columnName}" SET EXPRESSION AS (${newAsExpression})`,
        )

        const revertExpressionQuery = downQueries.find((query) =>
            query.query.includes("ALTER TABLE"),
        )
        revertExpressionQuery!.should.be.exist
        revertExpressionQuery!.query.should.be.contains(
            `ALTER COLUMN "${columnName}" SET EXPRESSION AS (${column.asExpression})`,
        )
    }

    // revert changes
    await queryRunner.executeMemoryDownSql()
    queryRunner.clearSqlMemory()

    table = await queryRunner.getTable(tableName)

    const revertedColumn = table!.findColumnByName(columnName)!
    revertedColumn.should.be.exist
    revertedColumn!.asExpression!.should.be.equal(column.asExpression)
}

export const changeType = async (
    table: Table | undefined,
    tableName: string,
    queryRunner: QueryRunner,
    columnName: string,
    newGeneratedType: "STORED" | "VIRTUAL" | undefined,
) => {
    const column = table!.findColumnByName(columnName)!
    const changedColumn = column.clone()
    changedColumn.generatedType = newGeneratedType
    let error: TypeORMError | undefined
    try {
        await queryRunner.changeColumn(table!, column, changedColumn)
    } catch (err) {
        error = err
    }

    if (
        !(queryRunner.dataSource.driver as PostgresDriver)
            .isVirtualGeneratedColumnsSupported &&
        (newGeneratedType === "VIRTUAL" || column.generatedType === "VIRTUAL")
    ) {
        error!.message.should.be.contain(
            `Changing generated column type from ${column.generatedType} to ${changedColumn.generatedType} is not supported in PostgreSQL version ${queryRunner.dataSource.driver.version}.`,
        )
        return
    }

    table = await queryRunner.getTable(tableName)

    const changedColumnFromDb = table!.findColumnByName(columnName)!
    changedColumnFromDb.should.be.exist
    expect(changedColumnFromDb!.generatedType).to.equal(newGeneratedType)

    const dropQuery = queryRunner
        .getMemorySql()
        .upQueries.find((query) => query.query.includes("ALTER TABLE"))
    dropQuery!.should.be.exist
    dropQuery!.query.should.be.contains(`DROP COLUMN "${columnName}"`)
    const addQuery = queryRunner
        .getMemorySql()
        .downQueries.find((query) => query.query.includes("ALTER TABLE"))
    addQuery!.should.be.exist
    addQuery!.query.should.be.contains(`ADD "${columnName}"`)

    // revert changes
    await queryRunner.executeMemoryDownSql()
    queryRunner.clearSqlMemory()

    table = await queryRunner.getTable(tableName)

    const revertedColumn = table!.findColumnByName(columnName)!
    revertedColumn.should.be.exist
    expect(revertedColumn!.generatedType).to.equal(column.generatedType)
}
