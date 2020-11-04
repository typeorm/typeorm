import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError";
import { ReadStream } from "../../platform/PlatformTools";
import { BaseQueryRunner } from "../../query-runner/BaseQueryRunner";
import { QueryRunner } from "../../query-runner/QueryRunner";
import { TableColumnOptions } from "../../schema-builder/options/TableColumnOptions";
import { TableIndexOptions } from "../../schema-builder/options/TableIndexOptions";
import { TableOptions } from "../../schema-builder/options/TableOptions";
import { Table } from "../../schema-builder/table/Table";
import { TableColumn } from "../../schema-builder/table/TableColumn";
import { TableIndex } from "../../schema-builder/table/TableIndex";
import { View } from "../../schema-builder/view/View";
import { Broadcaster } from "../../subscriber/Broadcaster";
import { Query } from "../Query";
import { IgniteDriver } from "./IgniteDriver";
import { IgniteTable, IgniteTableColumn, IgniteTableIndex } from "./types";

export class IgniteQueryRunner extends BaseQueryRunner implements QueryRunner {
    driver: IgniteDriver;

    constructor(driver: IgniteDriver) {
        super();
        this.driver = driver;
        this.connection = driver.connection;
        this.broadcaster = new Broadcaster(this);
    }

    async connect(): Promise<void> {}

    async release(): Promise<void> {
        this.isReleased = true;
    }

    /**
     * @override
     *
     * @param query
     * @param parameters
     */
    async query(query: string, parameters = []) {
        if (this.isReleased) {
            throw new QueryRunnerAlreadyReleasedError();
        }
        this.driver.connection.logger.logQuery(query, parameters, this);

        const sqlQuery = new this.driver.SqlFieldsQuery(query)
            .setArgs(...parameters)
            .setIncludeFieldNames(true);
        const cursor = await this.driver.cache.query(sqlQuery);

        const fieldNames = cursor.getFieldNames();
        const result = await cursor.getAll();

        return this.fromPairs(fieldNames, result);
    }

    protected fromPairs(fieldNames: string, valuesArray: any[]) {
        return valuesArray.map((values: any) =>
            values.reduce((pre: any, value: any, index: number) => {
                pre[fieldNames[index]] = value;
                return pre;
            }, {})
        );
    }

    async stream(): Promise<ReadStream> {
        throw new Error("not implemented");
    }

    // TODO: implement SQL transaction
    /**
     * @override
     */
    async startTransaction() {
        // if (this.isReleased) {
        //   throw new QueryRunnerAlreadyReleasedError();
        // }
        // if (this.isTransactionActive) {
        //   throw new TransactionAlreadyStartedError();
        // }
        // this.isTransactionActive = true;
        // await this.query("BEGIN");
    }

    /**
     * @override
     */
    async commitTransaction() {
        // if (this.isReleased) {
        //   throw new QueryRunnerAlreadyReleasedError();
        // }
        // if (!this.isTransactionActive) {
        //   throw new TransactionNotStartedError();
        // }
        // await this.query("COMMIT");
        // this.isTransactionActive = false;
    }

    /**
     * @override
     */
    async rollbackTransaction() {
        // if (this.isReleased) {
        //   throw new QueryRunnerAlreadyReleasedError();
        // }
        // if (!this.isTransactionActive) {
        //   throw new TransactionNotStartedError();
        // }
        // await this.query("ROLLBACK");
        // this.isTransactionActive = false;
    }

    async loadTables(tableNames: string[]): Promise<Table[]> {
        if (!tableNames || !tableNames.length) {
            return [];
        }
        const tableConditions = tableNames
            .map((tableName) => `TABLE_NAME = '${tableName}'`)
            .join(" OR ");
        const tableSqls = new this.driver.SqlFieldsQuery(
            `SELECT * FROM TABLES WHERE ${tableConditions}`
        )
            .setSchema("SYS")
            .setIncludeFieldNames(true);
        const columnSql = new this.driver.SqlFieldsQuery(
            `SELECT * FROM TABLE_COLUMNS WHERE ${tableConditions}`
        )
            .setSchema("SYS")
            .setIncludeFieldNames(true);
        const indicesSql = new this.driver.SqlFieldsQuery(
            `SELECT * FROM INDEXES WHERE ${tableConditions}`
        )
            .setSchema("SYS")
            .setIncludeFieldNames(true);

        const [tableCursor, columnsCursor, indexCursor] = await Promise.all([
            await this.driver.cache.query(tableSqls),
            await this.driver.cache.query(columnSql),
            await this.driver.cache.query(indicesSql),
        ]);

        const [dbTables, dbColumns, dbIndices]: [
            IgniteTable[],
            IgniteTableColumn[],
            IgniteTableIndex[]
        ] = await Promise.all([
            tableCursor
                .getAll()
                .then((values: any) =>
                    this.fromPairs(tableCursor.getFieldNames(), values)
                ),
            columnsCursor
                .getAll()
                .then((values: any) =>
                    this.fromPairs(columnsCursor.getFieldNames(), values)
                ),
            indexCursor
                .getAll()
                .then((values: any) =>
                    this.fromPairs(indexCursor.getFieldNames(), values)
                ),
        ]);

        return Promise.all(
            dbTables.map(async (dbTable) => {
                const tableColumnOptions: TableColumnOptions[] = dbColumns
                    .filter((dbColumn) => !dbColumn.COLUMN_NAME.startsWith("_"))
                    .map((dbColumn) => ({
                        name: dbColumn.COLUMN_NAME,
                        type: (dbColumn.TYPE || "").toLowerCase(),
                        default: dbColumn.DEFAULT_VALUE,
                        isNullable: dbColumn.NULLABLE,
                        isPrimary: dbColumn.PK,
                        precision: dbColumn.PRECISION,
                    }));

                const tableIndexOptions: TableIndexOptions[] = dbIndices
                    .filter((dbIndex) => !dbIndex.INDEX_NAME.startsWith("_"))
                    .map((dbIndex) => ({
                        name: dbIndex.INDEX_NAME,
                        columnNames: (dbIndex.COLUMNS || "")
                            .split(",")
                            .map((s) => s.trim().split(" ")[0]),
                    }));

                const tableOption: TableOptions = {
                    name: dbTable.TABLE_NAME,
                    columns: tableColumnOptions,
                    indices: tableIndexOptions,
                };

                return new Table(tableOption);
            })
        );
    }

    async getDatabases(): Promise<string[]> {
        return [];
    }

    async getSchemas(database?: string) {
        return [];
    }

    async createSchema() {
        throw new Error("Create Schema is not supported by Ignite");
    }

    async dropSchema() {
        throw new Error("Drop Schema is not supported by Ignite");
    }

    async hasDatabase(database: string): Promise<boolean> {
        return false;
    }

    async hasSchema(schema: string): Promise<boolean> {
        return false;
    }

    async hasTable(tableOrName: Table | string): Promise<boolean> {
        const name =
            tableOrName instanceof Table ? tableOrName.name : tableOrName;
        const query = new this.driver.SqlFieldsQuery(
            `SELECT * FROM TABLES WHERE TABLE_NAME = '${name}'`
        ).setSchema("SYS");
        const tables = await (await this.driver.cache.query(query)).getAll();
        return !!tables.length;
    }

    /**
     * @override
     * @param database
     * @param ifNotExist
     */
    async createDatabase(database: string, ifNotExist = false): Promise<void> {
        throw new Error("Create Database is not support by Ignite");
    }

    async dropDatabase() {
        throw new Error("Drop Database is not support by Ignite");
    }

    async createTable(
        table: Table,
        ifNotExist = false,
        createForeignKeys = true,
        createIndexes = true
    ): Promise<void> {
        if (ifNotExist) {
            const isTableExist = await this.hasTable(table);
            if (isTableExist) {
                return;
            }
        }

        const upQueries: Query[] = [this.createTableSql(table, ifNotExist)];
        const downQueries: Query[] = [this.dropTableSql(table)];

        if (createIndexes) {
            for (const index of table.indices) {
                if (!index.name) {
                    index.name = this.connection.namingStrategy.indexName(
                        table.name,
                        index.columnNames,
                        index.where
                    );
                }

                upQueries.push(this.createIndexSql(table, index));
                downQueries.push(this.dropIndexSql(index));
            }
        }

        await this.executeQueries(upQueries, downQueries);
    }

    async dropTable(
        tableOrName: Table | string,
        ifExist = false,
        dropForeignKeys = true,
        dropIndices = true
    ): Promise<void> {
        if (ifExist) {
            const isTableExist = await this.hasTable(tableOrName);
            if (!isTableExist) {
                return;
            }
        }

        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName);
        const upQueries: Query[] = [];
        const downQueries: Query[] = [];

        if (dropIndices) {
            for (const index of table.indices) {
                upQueries.push(this.dropIndexSql(index));
                downQueries.push(this.createIndexSql(table, index));
            }
        }

        upQueries.push(this.dropTableSql(table, ifExist));
        downQueries.push(this.createTableSql(table));

        await this.executeQueries(upQueries, downQueries);
    }

    async renameTable() {
        throw new Error("rename table is not supported in ignite");
    }

    async changeColumn() {
        throw new Error("change column is not supported in ignite");
    }

    async changeColumns() {}

    async hasColumn(
        tableOrName: Table | string,
        column: TableColumn | string
    ): Promise<boolean> {
        const tableName =
            tableOrName instanceof Table ? tableOrName.name : tableOrName;
        const columnName = column instanceof TableColumn ? column.name : column;
        const sql = this.driver.SqlFieldsQuery(
            `SELECT * FROM "${tableName}" WHERE COLUMN_NAME = '${columnName}'`
        );
        const columns = await (await this.driver.cache.query(sql)).getAll();
        return !!columns.length;
    }

    async addColumn(
        tableOrName: Table | string,
        column: TableColumn
    ): Promise<void> {
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName);

        const upQueries: Query[] = [this.addColumnSql(table, column)];
        const downQueries: Query[] = [this.dropColumnSql(table, column)];

        // create index mannually
        const columnIndex = table.indices.find(
            (index) =>
                index.columnNames.length === 1 &&
                index.columnNames[0] === column.name
        );
        if (columnIndex) {
            upQueries.push(this.createIndexSql(table, columnIndex));
            downQueries.push(this.dropIndexSql(columnIndex));
        }

        await this.executeQueries(upQueries, downQueries);
    }

    async addColumns(
        tableOrName: Table | string,
        columns: TableColumn[]
    ): Promise<void> {
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName);
        const upQueries: Query[] = [this.addColumnsSql(table, columns)];
        const downQueries: Query[] = [this.dropColumnsSql(table, columns)];

        for (const column of columns) {
            const columnIndex = table.indices.find(
                (index) =>
                    index.columnNames.length === 1 &&
                    index.columnNames[0] === column.name
            );
            if (columnIndex) {
                upQueries.push(this.createIndexSql(table, columnIndex));
                downQueries.push(this.dropIndexSql(columnIndex));
            }
        }

        await this.executeQueries(upQueries, downQueries);
    }

    async dropColumn(
        tableOrName: Table | string,
        columnOrName: TableColumn | string
    ): Promise<void> {
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName);
        const column =
            columnOrName instanceof TableColumn
                ? columnOrName
                : table.findColumnByName(columnOrName);
        if (!column) {
            throw new Error(
                `Column ${columnOrName} was not found in table ${table.name}`
            );
        }

        const upQueries: Query[] = [];
        const downQueries: Query[] = [];

        const columnIndex = table.indices.find(
            (index) =>
                index.columnNames.length === 1 &&
                index.columnNames[0] === column.name
        );
        if (columnIndex) {
            upQueries.push(this.dropIndexSql(columnIndex));
            downQueries.push(this.createIndexSql(table, columnIndex));
        }

        upQueries.push(this.dropColumnSql(table, column));
        downQueries.push(this.addColumnSql(table, column));

        await this.executeQueries(upQueries, downQueries);
    }

    async dropColumns(
        tableOrName: Table | string,
        columns: TableColumn[]
    ): Promise<void> {
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName);
        const upQueries: Query[] = [this.dropColumnsSql(table, columns)];
        const downQueries: Query[] = [this.addColumnsSql(table, columns)];

        for (const column of columns) {
            const columnIndex = table.indices.find(
                (index) =>
                    index.columnNames.length === 1 &&
                    index.columnNames[0] === column.name
            );
            if (columnIndex) {
                upQueries.push(this.dropIndexSql(columnIndex));
                downQueries.push(this.createIndexSql(table, columnIndex));
            }
        }

        await this.executeQueries(upQueries, downQueries);
    }

    async renameColumn(
        tableOrName: Table | string,
        oldTableColumnOrName: TableColumn | string,
        newTableColumnOrName: TableColumn | string
    ): Promise<void> {
        throw new Error("rename column is not supported by Ignite");
    }

    async createView(view: View): Promise<void> {
        throw new Error("Create view is not supported by Ignite");
    }

    async dropView(view: View): Promise<void> {
        throw new Error("Drop View is not supported by Ignite");
    }

    async createPrimaryKey() {
        throw new Error("Create Primary Key is not supported by Ignite");
    }

    async updatePrimaryKeys() {
        throw new Error("Update Primary Keys is not supported by Ignite");
    }

    async dropPrimaryKey() {
        throw new Error("Drop Primary Key is not supported by Ignite");
    }

    async createUniqueConstraint() {
        throw new Error("Create Unique Constraint is not supported by Ignite");
    }

    async createUniqueConstraints() {
        throw new Error("Create Unique Constraints is not supported by Ignite");
    }

    async dropUniqueConstraint() {
        throw new Error("Drop Unique Constraint is not supported by Ignite");
    }

    async dropUniqueConstraints() {
        throw new Error("Drop Unique Constraint is not supported by Ignite");
    }

    async createCheckConstraint() {
        throw new Error("Create Check Constraint is not supported by Ignite");
    }

    async createCheckConstraints() {
        throw new Error("Create Check Constraints is not supported by Ignite");
    }

    async dropCheckConstraint() {
        throw new Error("Drop Check Constraint is not supported by Ignite");
    }

    async dropCheckConstraints() {
        throw new Error("Drop Check Constraints is not supported by Ignite");
    }

    async createExclusionConstraint() {
        throw new Error(
            "Create Exclusion Constraint is not supported by Ignite"
        );
    }

    async createExclusionConstraints() {
        throw new Error(
            "Create Exclusion Constraints is not supported by Ignite"
        );
    }

    async dropExclusionConstraint() {
        throw new Error("Drop Exclusion Constraint is not supported by Ignite");
    }

    async createForeignKey() {
        throw new Error("Create Foreign Key is not supported by Ignite");
    }

    async createForeignKeys() {
        throw new Error("Create Foreign Keys is not supported by Ignite");
    }

    async dropExclusionConstraints() {
        throw new Error(
            "Drop Exclusion Constraints is not supported by Ignite"
        );
    }

    async dropForeignKeys() {
        throw new Error("Drop Foreign Keys is not supported by Ignite");
    }

    async dropForeignKey() {
        throw new Error("Drop Foreign Key is not supported by Ignite");
    }

    async createIndex(
        tableOrName: Table | string,
        index: TableIndex
    ): Promise<void> {
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName);
        if (!index.name) {
            index.name = this.connection.namingStrategy.indexName(
                table.name,
                index.columnNames,
                index.where
            );
        }
        const up = this.createIndexSql(table, index);
        const down = this.dropIndexSql(index);
        await this.executeQueries(up, down);
        table.addIndex(index);
    }

    async createIndices(
        tableOrName: Table | string,
        indices: TableIndex[]
    ): Promise<void> {
        const promises = indices.map((index) =>
            this.createIndex(tableOrName, index)
        );
        await Promise.all(promises);
    }

    async dropIndex(
        tableOrName: Table | string,
        indexOrName: TableIndex | string
    ): Promise<void> {
        const table =
            tableOrName instanceof Table
                ? tableOrName
                : await this.getCachedTable(tableOrName);
        const index =
            indexOrName instanceof TableIndex
                ? indexOrName
                : table.indices.find((i) => i.name === indexOrName);
        if (!index)
            throw new Error(
                `Supplied index was not found in table ${table.name}`
            );

        const up = this.dropIndexSql(index);
        const down = this.createIndexSql(table, index);
        await this.executeQueries(up, down);
        table.removeIndex(index);
    }

    /**
     * Drops an indices from the table.
     */
    async dropIndices(
        tableOrName: Table | string,
        indices: TableIndex[]
    ): Promise<void> {
        const promises = indices.map((index) =>
            this.dropIndex(tableOrName, index)
        );
        await Promise.all(promises);
    }

    async clearTable() {
        throw new Error("Clear Table is not supported by Ignite");
    }

    async clearDatabase() {
        return this.driver.client.destroyCache(this.driver.options.database);
    }

    protected async loadViews(): Promise<View[]> {
        return [];
    }

    protected createTableSql(table: Table, ifNotExist = false): Query {
        const primaryColumns = table.columns.filter(
            (column) => column.isPrimary
        );
        const skipPrimary = primaryColumns.length > 1;

        const columnDefinitions = table.columns
            .map((column) => this.buildCreateColumnSql(column, skipPrimary))
            .join(", ");

        let sql = "CREATE TABLE";
        if (ifNotExist) sql += " IF NOT EXISTS";
        sql += ` "${table.name}"`;
        sql += ` (${columnDefinitions}`;

        if (primaryColumns.length > 1) {
            const columnNames = primaryColumns
                .map((column) => `"${column.name}"`)
                .join(", ");
            sql += `, PRIMARY KEY (${columnNames})`;
        }

        sql += ")";

        sql += ` WITH "template=PARTITIONED,backups=1,CACHE_NAME=${table.name}"`;

        return new Query(sql);
    }

    /**
     * check constraint & unque constraint not supported
     * @param column
     * @param skipPrimary
     */
    protected buildCreateColumnSql(
        column: TableColumn,
        skipPrimary: boolean
    ): string {
        let c = `"${column.name}" ${column.type}`;
        if (column.isPrimary && !skipPrimary) {
            c += " PRIMARY KEY";
        }

        if (column.isNullable !== true) {
            c += " NOT NULL";
        }

        if (column.default !== undefined && column.default !== null) {
            c += " DEFAULT " + column.default;
        }

        return c;
    }

    protected dropTableSql(
        tableOrName: Table | string,
        ifExist = false
    ): Query {
        const tableName =
            tableOrName instanceof Table ? tableOrName.name : tableOrName;
        const sql = ifExist
            ? `DROP TABLE IF EXISTS "${tableName}"`
            : `DROP TABLE "${tableName}"`;
        return new Query(sql);
    }

    protected createIndexSql(table: Table, index: TableIndex): Query {
        const columns = index.columnNames.join(", ");
        const sql = `CREATE INDEX "${index.name}" ON "${table.name}" (${columns})`;

        return new Query(sql);
    }

    protected dropIndexSql(indexOrName: TableIndex | string): Query {
        const indexName =
            indexOrName instanceof TableIndex ? indexOrName.name : indexOrName;
        const sql = `DROP INDEX IF EXISTS "${indexName}"`;
        return new Query(sql);
    }

    protected addColumnSql(table: Table, column: TableColumn): Query {
        const sql = `ALTER TABLE "${table.name}" ADD COLUMN "${column.name}"`;
        return new Query(sql);
    }

    protected dropColumnSql(table: Table, column: TableColumn): Query {
        const sql = `ALTER TABLE "${table.name}" DROP COLUMN "${column.name}"`;
        return new Query(sql);
    }

    protected addColumnsSql(table: Table, columns: TableColumn[]): Query {
        const columnNames = columns
            .map((column) => `"${column.name}" ${column.type}`)
            .join(", ");
        const sql = `ALTER TABLE "${table.name}" ADD COLUMN (${columnNames})`;
        return new Query(sql);
    }

    protected dropColumnsSql(table: Table, columns: TableColumn[]): Query {
        const columnNames = columns
            .map((column) => `"${column.name}" ${column.type}`)
            .join(", ");
        const sql = `ALTER TABLE "${table.name}" DROP COLUMN (${columnNames})`;
        return new Query(sql);
    }
}
