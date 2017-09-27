import {TableColumn} from "./TableColumn";
import {TableIndex} from "./TableIndex";
import {TableForeignKey} from "./TableForeignKey";
import {TablePrimaryKey} from "./TablePrimaryKey";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {Driver} from "../../driver/Driver";
import {ColumnType} from "../../driver/types/ColumnTypes";

/**
 * Table in the database represented in this class.
 */
export class Table {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Table name.
     */
    name: string;

    /**
     * Table columns.
     */
    columns: TableColumn[] = [];

    /**
     * Table indices.
     */
    indices: TableIndex[] = [];

    /**
     * Table foreign keys.
     */
    foreignKeys: TableForeignKey[] = [];

    /**
     * Table primary keys.
     */
    primaryKeys: TablePrimaryKey[] = [];

    /**
     * Indicates if table was just created.
     * This is needed, for example to check if we need to skip primary keys creation
     * for new tables.
     */
    justCreated: boolean = false;

    /**
     * Table engine.
     */
    engine?: string;

    /**
     * Database name.
     */
    database?: string;

    /**
     * Schema name. Used in Postgres and Sql Server.
     */
    schema?: string;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(name: string, columns?: TableColumn[]|ObjectLiteral[], justCreated?: boolean, engine?: string, database?: string, schema?: string) {
        this.name = name;
        if (columns) {
            this.columns = (columns as any[]).map(column => { // as any[] is a temporary fix (some weird compiler error)
                if (column instanceof TableColumn) {
                    return column;
                } else {
                    return new TableColumn(column);
                }
            });
        }

        if (justCreated !== undefined)
            this.justCreated = justCreated;

        this.engine = engine;
        this.database = database;
        this.schema = schema;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets only those primary keys that does not
     */
    get primaryKeysWithoutGenerated(): TablePrimaryKey[] {
        const generatedColumn = this.columns.find(column => column.isGenerated);
        if (!generatedColumn)
            return this.primaryKeys;

        return this.primaryKeys.filter(primaryKey => {
            return primaryKey.columnName !== generatedColumn.name;
        });
    }

    get hasGeneratedColumn(): boolean {
        return !!this.columns.find(column => column.isGenerated);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Clones this table to a new table with all properties cloned.
     */
    clone(): Table {
        const cloned = new Table(this.name);
        cloned.columns = this.columns.map(column => column.clone());
        cloned.indices = this.indices.map(index => index.clone());
        cloned.foreignKeys = this.foreignKeys.map(key => key.clone());
        cloned.primaryKeys = this.primaryKeys.map(key => key.clone());
        cloned.engine = this.engine;
        cloned.database = this.database;
        cloned.schema = this.schema;
        return cloned;
    }

    /**
     * Adds columns.
     */
    addColumns(columns: TableColumn[]) {
        this.columns = this.columns.concat(columns);
    }

    /**
     * Replaces given column.
     */
    replaceColumn(oldColumn: TableColumn, newColumn: TableColumn) {
        this.columns[this.columns.indexOf(oldColumn)] = newColumn;
    }

    /**
     * Removes a columns from this table.
     */
    removeColumn(columnToRemove: TableColumn) {
        const foundColumn = this.columns.find(column => column.name === columnToRemove.name);
        if (foundColumn)
            this.columns.splice(this.columns.indexOf(foundColumn), 1);
    }

    /**
     * Remove all columns from this table.
     */
    removeColumns(columns: TableColumn[]) {
        columns.forEach(column => this.removeColumn(column));
    }

    /**
     * Adds all given primary keys.
     */
    addPrimaryKeys(addedKeys: TablePrimaryKey[]) {
        addedKeys.forEach(key => this.primaryKeys.push(key));
    }

    /**
     * Removes all given primary keys.
     */
    removePrimaryKeys(droppedKeys: TablePrimaryKey[]) {
        droppedKeys.forEach(key => {
            this.primaryKeys.splice(this.primaryKeys.indexOf(key), 1);
        });
    }

    /**
     * Removes primary keys of the given columns.
     */
    removePrimaryKeysOfColumns(columns: TableColumn[]) {
        this.primaryKeys = this.primaryKeys.filter(primaryKey => {
            return !columns.find(column => column.name === primaryKey.columnName);
        });
    }

    /**
     * Adds foreign keys.
     */
    addForeignKeys(foreignKeys: TableForeignKey[]) {
        this.foreignKeys = this.foreignKeys.concat(foreignKeys);
    }

    /**
     * Removes foreign key from this table.
     */
    removeForeignKey(removedForeignKey: TableForeignKey) {
        const fk = this.foreignKeys.find(foreignKey => foreignKey.name === removedForeignKey.name); // this must be by name
        if (fk)
            this.foreignKeys.splice(this.foreignKeys.indexOf(fk), 1);
    }

    /**
     * Removes all foreign keys from this table.
     */
    removeForeignKeys(dbForeignKeys: TableForeignKey[]) {
        dbForeignKeys.forEach(foreignKey => this.removeForeignKey(foreignKey));
    }

    /**
     * Removes indices from this table.
     */
    removeIndex(tableIndex: TableIndex) {
        const index = this.indices.find(index => index.name === tableIndex.name);
        if (index)
            this.indices.splice(this.indices.indexOf(index), 1);
    }

    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(driver: Driver, columnMetadatas: ColumnMetadata[]): TableColumn[] {
        return this.columns.filter(tableColumn => {
            const columnMetadata = columnMetadatas.find(columnMetadata => columnMetadata.databaseName === tableColumn.name);
            if (!columnMetadata)
                return false; // we don't need new columns, we only need exist and changed

            // console.log(tableColumn.name, "!==", columnMetadata.databaseName); //  ||
            // console.log(tableColumn.type, "!==", driver.normalizeType(columnMetadata)); // ||
            // console.log(tableColumn.comment, "!==", columnMetadata.comment); //  ||
            // console.log(this.compareDefaultValues(driver.normalizeDefault(columnMetadata), tableColumn.default)); // || // we included check for generated here, because generated columns already can have default values
            // console.log(tableColumn.isNullable, "!==", columnMetadata.isNullable); //  ||
            // console.log(tableColumn.isUnique, "!==", columnMetadata.isUnique); //  ||
            // console.log(tableColumn.isGenerated, "!==", columnMetadata.isGenerated);

            return  tableColumn.name !== columnMetadata.databaseName ||
                    tableColumn.type !== driver.normalizeType(columnMetadata) ||
                    tableColumn.comment !== columnMetadata.comment ||
                    (!tableColumn.isGenerated && !this.compareDefaultValues(driver.normalizeDefault(columnMetadata), tableColumn.default)) || // we included check for generated here, because generated columns already can have default values
                    tableColumn.isNullable !== columnMetadata.isNullable ||
                    tableColumn.isUnique !== driver.normalizeIsUnique(columnMetadata) ||
                    // tableColumn.isPrimary !== columnMetadata.isPrimary ||
                    tableColumn.isGenerated !== columnMetadata.isGenerated ||
                    !this.compareColumnLengths(driver, tableColumn, columnMetadata);
        });
    }

    findColumnByName(name: string): TableColumn|undefined {
        return this.columns.find(column => column.name === name);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Compare column lengths only if the datatype supports it.
     */

    private compareColumnLengths(driver: Driver, tableColumn: TableColumn, columnMetadata: ColumnMetadata): boolean {

        const normalizedColumn = driver.normalizeType(columnMetadata) as ColumnType;
        if (driver.withLengthColumnTypes.indexOf(normalizedColumn) !== -1) {
            let metadataLength = driver.getColumnLength(columnMetadata);

            // if we found something to compare with then do it, else skip it
            // use use case insensitive comparison to catch "MAX" vs "Max" case
            if (metadataLength)
                return tableColumn.length.toLowerCase() === metadataLength.toLowerCase();
        }

        return true;

    }    

    /**
     * Checks if "DEFAULT" values in the column metadata and in the database are equal.
     */
    protected compareDefaultValues(columnMetadataValue: string, databaseValue: string): boolean {

        // if (typeof columnMetadataValue === "number")
        //     return columnMetadataValue === parseInt(databaseValue);
        // if (typeof columnMetadataValue === "boolean")
        //     return columnMetadataValue === (!!databaseValue || databaseValue === "false");
        // if (typeof columnMetadataValue === "function")
        // if (typeof columnMetadataValue === "string" && typeof databaseValue === "string")
        //     return columnMetadataValue.toLowerCase() === databaseValue.toLowerCase();


        if (typeof columnMetadataValue === "string" && typeof databaseValue === "string") {

            // we need to cut out "((x))" where x number generated by mssql
            columnMetadataValue = columnMetadataValue.replace(/\(\([0-9.]*\)\)$/g, "$1");
            databaseValue = databaseValue.replace(/\(\(([0-9.]*?)\)\)$/g, "$1");

            // we need to cut out "(" because in mssql we can understand returned value is a string or a function
            // as result compare cannot understand if default is really changed or not
            columnMetadataValue = columnMetadataValue.replace(/^\(|\)$/g, "");
            databaseValue = databaseValue.replace(/^\(|\)$/g, "");

            // we need to cut out "'" because in mysql we can understand returned value is a string or a function
            // as result compare cannot understand if default is really changed or not
            columnMetadataValue = columnMetadataValue.replace(/^'+|'+$/g, "");
            databaseValue = databaseValue.replace(/^'+|'+$/g, "");
        }

        // console.log("columnMetadataValue", columnMetadataValue);
        // console.log("databaseValue", databaseValue);
        return columnMetadataValue === databaseValue;
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates table from a given entity metadata.
     *
     * todo: need deeper implementation
     */
    static create(entityMetadata: EntityMetadata, driver: Driver) {
        const table = new Table(entityMetadata.tableName);
        table.engine = entityMetadata.engine;
        table.database = entityMetadata.database;
        table.schema = entityMetadata.schema;
        entityMetadata.columns.forEach(column => {
            const tableColumn = TableColumn.create(column, 
                driver.normalizeType(column), 
                driver.normalizeDefault(column),
                driver.getColumnLength(column)); 
            table.columns.push(tableColumn);
        });

        return table;
    }

}