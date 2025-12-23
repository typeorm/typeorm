# Query Runner API

In order to use an API to change a database schema you can use `QueryRunner`.

```ts
import {
    MigrationInterface,
    QueryRunner,
    Table,
    TableIndex,
    TableColumn,
    TableForeignKey,
} from "typeorm"

export class QuestionRefactoringTIMESTAMP implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "question",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                    },
                    {
                        name: "name",
                        type: "varchar",
                    },
                ],
            }),
            true,
        )

        await queryRunner.createIndex(
            "question",
            new TableIndex({
                name: "IDX_QUESTION_NAME",
                columnNames: ["name"],
            }),
        )

        await queryRunner.createTable(
            new Table({
                name: "answer",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                    },
                    {
                        name: "name",
                        type: "varchar",
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true,
        )

        await queryRunner.addColumn(
            "answer",
            new TableColumn({
                name: "questionId",
                type: "int",
            }),
        )

        await queryRunner.createForeignKey(
            "answer",
            new TableForeignKey({
                columnNames: ["questionId"],
                referencedColumnNames: ["id"],
                referencedTableName: "question",
                onDelete: "CASCADE",
            }),
        )
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("answer")
        const foreignKey = table.foreignKeys.find(
            (fk) => fk.columnNames.indexOf("questionId") !== -1,
        )
        await queryRunner.dropForeignKey("answer", foreignKey)
        await queryRunner.dropColumn("answer", "questionId")
        await queryRunner.dropTable("answer")
        await queryRunner.dropIndex("question", "IDX_QUESTION_NAME")
        await queryRunner.dropTable("question")
    }
}
```

---

```ts
getDatabases(): Promise<string[]>
```

Returns all available database names including system databases.

---

```ts
getSchemas(database?: string): Promise<string[]>
```

-   `database` - If database parameter specified, returns schemas of that database

Returns all available schema names including system schemas. Useful for SQLServer and Postgres only.

---

```ts
getTable(tableName: string): Promise<Table|undefined>
```

-   `tableName` - name of a table to be loaded

Loads a table by a given name from the database.

---

```ts
getTables(tableNames: string[]): Promise<Table[]>
```

-   `tableNames` - name of a tables to be loaded

Loads a tables by a given names from the database.

---

```ts
hasDatabase(database: string): Promise<boolean>
```

-   `database` - name of a database to be checked

Checks if database with the given name exist.

---

```ts
hasSchema(schema: string): Promise<boolean>
```

-   `schema` - name of a schema to be checked

Checks if schema with the given name exist. Used only for SqlServer and Postgres.

---

```ts
hasTable(table: Table|string): Promise<boolean>
```

-   `table` - Table object or name

Checks if table exist.

---

```ts
hasColumn(table: Table|string, columnName: string): Promise<boolean>
```

-   `table` - Table object or name
-   `columnName` - name of a column to be checked

Checks if column exist in the table.

---

```ts
createDatabase(database: string, ifNotExist?: boolean): Promise<void>
```

-   `database` - database name
-   `ifNotExist` - skips creation if `true`, otherwise throws error if database already exist

Creates a new database.

---

```ts
dropDatabase(database: string, ifExist?: boolean): Promise<void>
```

-   `database` - database name
-   `ifExist` - skips deletion if `true`, otherwise throws error if database was not found

Drops database.

---

```ts
createSchema(schemaPath: string, ifNotExist?: boolean): Promise<void>
```

-   `schemaPath` - schema name. For SqlServer can accept schema path (e.g. 'dbName.schemaName') as parameter.
    If schema path passed, it will create schema in specified database
-   `ifNotExist` - skips creation if `true`, otherwise throws error if schema already exist

Creates a new table schema.

---

```ts
dropSchema(schemaPath: string, ifExist?: boolean, isCascade?: boolean): Promise<void>
```

-   `schemaPath` - schema name. For SqlServer can accept schema path (e.g. 'dbName.schemaName') as parameter.
    If schema path passed, it will drop schema in specified database
-   `ifExist` - skips deletion if `true`, otherwise throws error if schema was not found
-   `isCascade` - If `true`, automatically drop objects (tables, functions, etc.) that are contained in the schema.
    Used only in Postgres.

Drops a table schema.

---

```ts
createTable(table: Table, ifNotExist?: boolean, createForeignKeys?: boolean, createIndices?: boolean): Promise<void>
```

-   `table` - Table object.
-   `ifNotExist` - skips creation if `true`, otherwise throws error if table already exist. Default `false`
-   `createForeignKeys` - indicates whether foreign keys will be created on table creation. Default `true`
-   `createIndices` - indicates whether indices will be created on table creation. Default `true`

Creates a new table.

---

```ts
dropTable(table: Table|string, ifExist?: boolean, dropForeignKeys?: boolean, dropIndices?: boolean): Promise<void>
```

-   `table` - Table object or table name to be dropped
-   `ifExist` - skips dropping if `true`, otherwise throws error if table does not exist
-   `dropForeignKeys` - indicates whether foreign keys will be dropped on table deletion. Default `true`
-   `dropIndices` - indicates whether indices will be dropped on table deletion. Default `true`

Drops a table.

---

```ts
renameTable(oldTableOrName: Table|string, newTableName: string): Promise<void>
```

-   `oldTableOrName` - old Table object or name to be renamed
-   `newTableName` - new table name

Renames a table.

---

```ts
addColumn(table: Table|string, column: TableColumn): Promise<void>
```

-   `table` - Table object or name
-   `column` - new column

Adds a new column.

---

```ts
addColumns(table: Table|string, columns: TableColumn[]): Promise<void>
```

-   `table` - Table object or name
-   `columns` - new columns

Adds a new column.

---

```ts
renameColumn(table: Table|string, oldColumnOrName: TableColumn|string, newColumnOrName: TableColumn|string): Promise<void>
```

-   `table` - Table object or name
-   `oldColumnOrName` - old column. Accepts TableColumn object or column name
-   `newColumnOrName` - new column. Accepts TableColumn object or column name

Renames a column.

---

```ts
changeColumn(table: Table|string, oldColumn: TableColumn|string, newColumn: TableColumn): Promise<void>
```

-   `table` - Table object or name
-   `oldColumn` - old column. Accepts TableColumn object or column name
-   `newColumn` - new column. Accepts TableColumn object

Changes a column in the table.

---

```ts
changeColumns(table: Table|string, changedColumns: { oldColumn: TableColumn, newColumn: TableColumn }[]): Promise<void>
```

-   `table` - Table object or name
-   `changedColumns` - array of changed columns.
    -   `oldColumn` - old TableColumn object
    -   `newColumn` - new TableColumn object

Changes a columns in the table.

---

```ts
dropColumn(table: Table|string, column: TableColumn|string): Promise<void>
```

-   `table` - Table object or name
-   `column` - TableColumn object or column name to be dropped

Drops a column in the table.

---

```ts
dropColumns(table: Table|string, columns: TableColumn[]|string[]): Promise<void>
```

-   `table` - Table object or name
-   `columns` - array of TableColumn objects or column names to be dropped

Drops a columns in the table.

---

```ts
createPrimaryKey(table: Table|string, columnNames: string[]): Promise<void>
```

-   `table` - Table object or name
-   `columnNames` - array of column names which will be primary

Creates a new primary key.

---

```ts
updatePrimaryKeys(table: Table|string, columns: TableColumn[]): Promise<void>
```

-   `table` - Table object or name
-   `columns` - array of TableColumn objects which will be updated

Updates composite primary keys.

---

```ts
dropPrimaryKey(table: Table|string): Promise<void>
```

-   `table` - Table object or name

Drops a primary key.

---

```ts
createUniqueConstraint(table: Table|string, uniqueConstraint: TableUnique): Promise<void>
```

-   `table` - Table object or name
-   `uniqueConstraint` - TableUnique object to be created

Creates new unique constraint.

> Note: does not work for MySQL, because MySQL stores unique constraints as unique indices. Use `createIndex()` method instead.

---

```ts
createUniqueConstraints(table: Table|string, uniqueConstraints: TableUnique[]): Promise<void>
```

-   `table` - Table object or name
-   `uniqueConstraints` - array of TableUnique objects to be created

Creates new unique constraints.

> Note: does not work for MySQL, because MySQL stores unique constraints as unique indices. Use `createIndices()` method instead.

---

```ts
dropUniqueConstraint(table: Table|string, uniqueOrName: TableUnique|string): Promise<void>
```

-   `table` - Table object or name
-   `uniqueOrName` - TableUnique object or unique constraint name to be dropped

Drops a unique constraint.

> Note: does not work for MySQL, because MySQL stores unique constraints as unique indices. Use `dropIndex()` method instead.

---

```ts
dropUniqueConstraints(table: Table|string, uniqueConstraints: TableUnique[]): Promise<void>
```

-   `table` - Table object or name
-   `uniqueConstraints` - array of TableUnique objects to be dropped

Drops unique constraints.

> Note: does not work for MySQL, because MySQL stores unique constraints as unique indices. Use `dropIndices()` method instead.

---

```ts
createCheckConstraint(table: Table|string, checkConstraint: TableCheck): Promise<void>
```

-   `table` - Table object or name
-   `checkConstraint` - TableCheck object

Creates a new check constraint.

> Note: MySQL supports CHECK constraints starting from version 8.0.16. For earlier MySQL versions CHECK definitions are parsed but ignored by the server. Ensure your MySQL server is >= 8.0.16 to use CHECK constraints.

---

```ts
createCheckConstraints(table: Table|string, checkConstraints: TableCheck[]): Promise<void>
```

-   `table` - Table object or name
-   `checkConstraints` - array of TableCheck objects

Creates a new check constraint.

> Note: MySQL supports CHECK constraints starting from version 8.0.16. Older versions silently ignore them.

---

```ts
dropCheckConstraint(table: Table|string, checkOrName: TableCheck|string): Promise<void>
```

-   `table` - Table object or name
-   `checkOrName` - TableCheck object or check constraint name

Drops check constraint.

> Note: MySQL supports CHECK constraints starting from version 8.0.16. Older versions silently ignore them.

---

```ts
dropCheckConstraints(table: Table|string, checkConstraints: TableCheck[]): Promise<void>
```

-   `table` - Table object or name
-   `checkConstraints` - array of TableCheck objects

Drops check constraints.

> Note: MySQL supports CHECK constraints starting from version 8.0.16. Older versions silently ignore them.

---

```ts
createForeignKey(table: Table|string, foreignKey: TableForeignKey): Promise<void>
```

-   `table` - Table object or name
-   `foreignKey` - TableForeignKey object

Creates a new foreign key.

---

```ts
createForeignKeys(table: Table|string, foreignKeys: TableForeignKey[]): Promise<void>
```

-   `table` - Table object or name
-   `foreignKeys` - array of TableForeignKey objects

Creates a new foreign keys.

---

```ts
dropForeignKey(table: Table|string, foreignKeyOrName: TableForeignKey|string): Promise<void>
```

-   `table` - Table object or name
-   `foreignKeyOrName` - TableForeignKey object or foreign key name

Drops a foreign key.

---

```ts
dropForeignKeys(table: Table|string, foreignKeys: TableForeignKey[]): Promise<void>
```

-   `table` - Table object or name
-   `foreignKeys` - array of TableForeignKey objects

Drops a foreign keys.

---

```ts
createIndex(table: Table|string, index: TableIndex): Promise<void>
```

-   `table` - Table object or name
-   `index` - TableIndex object

Creates a new index.

---

```ts
createIndices(table: Table|string, indices: TableIndex[]): Promise<void>
```

-   `table` - Table object or name
-   `indices` - array of TableIndex objects

Creates a new indices.

---

```ts
dropIndex(table: Table|string, index: TableIndex|string): Promise<void>
```

-   `table` - Table object or name
-   `index` - TableIndex object or index name

Drops an index.

---

```ts
dropIndices(table: Table|string, indices: TableIndex[]): Promise<void>
```

-   `table` - Table object or name
-   `indices` - array of TableIndex objects

Drops an indices.

---

```ts
clearTable(tableName: string): Promise<void>
```

-   `tableName` - table name

Clears all table contents.

> Note: this operation uses SQL's TRUNCATE query which cannot be reverted in transactions.

---

```ts
enableSqlMemory(): void
```

Enables special query runner mode in which sql queries won't be executed, instead they will be memorized into a special variable inside query runner.
You can get memorized sql using `getMemorySql()` method.

---

```ts
disableSqlMemory(): void
```

Disables special query runner mode in which sql queries won't be executed. Previously memorized sql will be flushed.

---

```ts
clearSqlMemory(): void
```

Flushes all memorized sql statements.

---

```ts
getMemorySql(): SqlInMemory
```

-   returns `SqlInMemory` object with array of `upQueries` and `downQueries` sql statements

Gets sql stored in the memory. Parameters in the sql are already replaced.

---

```ts
executeMemoryUpSql(): Promise<void>
```

Executes memorized up sql queries.

---

```ts
executeMemoryDownSql(): Promise<void>
```

Executes memorized down sql queries.

---
