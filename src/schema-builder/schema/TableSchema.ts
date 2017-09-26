import {ColumnSchema} from "./ColumnSchema";
import {IndexSchema} from "./IndexSchema";
import {ForeignKeySchema} from "./ForeignKeySchema";
import {PrimaryKeySchema} from "./PrimaryKeySchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {Driver} from "../../driver/Driver";
import {ColumnType} from "../../driver/types/ColumnTypes";

/**
 * Table schema in the database represented in this class.
 */
export class TableSchema {

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
    columns: ColumnSchema[] = [];

    /**
     * Table indices.
     */
    indices: IndexSchema[] = [];

    /**
     * Table foreign keys.
     */
    foreignKeys: ForeignKeySchema[] = [];

    /**
     * Table primary keys.
     */
    primaryKeys: PrimaryKeySchema[] = [];

    /**
     * Indicates if table schema was just created.
     * This is needed, for example to check if we need to skip primary keys creation
     * for new table schemas.
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

    constructor(name: string, columns?: ColumnSchema[]|ObjectLiteral[], justCreated?: boolean, engine?: string, database?: string, schema?: string) {
        this.name = name;
        if (columns) {
            this.columns = (columns as any[]).map(column => { // as any[] is a temporary fix (some weird compiler error)
                if (column instanceof ColumnSchema) {
                    return column;
                } else {
                    return new ColumnSchema(column);
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
    get primaryKeysWithoutGenerated(): PrimaryKeySchema[] {
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
     * Clones this table schema to a new table schema with all properties cloned.
     */
    clone(): TableSchema {
        const cloned = new TableSchema(this.name);
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
     * Adds column schemas.
     */
    addColumns(columns: ColumnSchema[]) {
        this.columns = this.columns.concat(columns);
    }

    /**
     * Replaces given column.
     */
    replaceColumn(oldColumn: ColumnSchema, newColumn: ColumnSchema) {
        this.columns[this.columns.indexOf(oldColumn)] = newColumn;
    }

    /**
     * Removes a column schema from this table schema.
     */
    removeColumn(columnToRemove: ColumnSchema) {
        const foundColumn = this.columns.find(column => column.name === columnToRemove.name);
        if (foundColumn)
            this.columns.splice(this.columns.indexOf(foundColumn), 1);
    }

    /**
     * Remove all column schemas from this table schema.
     */
    removeColumns(columns: ColumnSchema[]) {
        columns.forEach(column => this.removeColumn(column));
    }

    /**
     * Adds all given primary keys.
     */
    addPrimaryKeys(addedKeys: PrimaryKeySchema[]) {
        addedKeys.forEach(key => this.primaryKeys.push(key));
    }

    /**
     * Removes all given primary keys.
     */
    removePrimaryKeys(droppedKeys: PrimaryKeySchema[]) {
        droppedKeys.forEach(key => {
            this.primaryKeys.splice(this.primaryKeys.indexOf(key), 1);
        });
    }

    /**
     * Removes primary keys of the given columns.
     */
    removePrimaryKeysOfColumns(columns: ColumnSchema[]) {
        this.primaryKeys = this.primaryKeys.filter(primaryKey => {
            return !columns.find(column => column.name === primaryKey.columnName);
        });
    }

    /**
     * Adds foreign key schemas.
     */
    addForeignKeys(foreignKeys: ForeignKeySchema[]) {
        this.foreignKeys = this.foreignKeys.concat(foreignKeys);
    }

    /**
     * Removes foreign key from this table schema.
     */
    removeForeignKey(removedForeignKey: ForeignKeySchema) {
        const fk = this.foreignKeys.find(foreignKey => foreignKey.name === removedForeignKey.name); // this must be by name
        if (fk)
            this.foreignKeys.splice(this.foreignKeys.indexOf(fk), 1);
    }

    /**
     * Removes all foreign keys from this table schema.
     */
    removeForeignKeys(dbForeignKeys: ForeignKeySchema[]) {
        dbForeignKeys.forEach(foreignKey => this.removeForeignKey(foreignKey));
    }

    /**
     * Removes index schema from this table schema.
     */
    removeIndex(indexSchema: IndexSchema) {
        const index = this.indices.find(index => index.name === indexSchema.name);
        if (index)
            this.indices.splice(this.indices.indexOf(index), 1);
    }

    /**
     * Differentiate columns of this table schema and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(driver: Driver, columnMetadatas: ColumnMetadata[]): ColumnSchema[] {
        return this.columns.filter(columnSchema => {
            const columnMetadata = columnMetadatas.find(columnMetadata => columnMetadata.databaseName === columnSchema.name);
            if (!columnMetadata)
                return false; // we don't need new columns, we only need exist and changed

            // console.log(columnSchema.name, "!==", columnMetadata.databaseName); //  ||
            // console.log(columnSchema.type, "!==", driver.normalizeType(columnMetadata)); // ||
            // console.log(columnSchema.comment, "!==", columnMetadata.comment); //  ||
            // console.log(this.compareDefaultValues(driver.normalizeDefault(columnMetadata), columnSchema.default)); // || // we included check for generated here, because generated columns already can have default values
            // console.log(columnSchema.isNullable, "!==", columnMetadata.isNullable); //  ||
            // console.log(columnSchema.isUnique, "!==", columnMetadata.isUnique); //  ||
            // console.log(columnSchema.isGenerated, "!==", columnMetadata.isGenerated);

            return  columnSchema.name !== columnMetadata.databaseName ||
                    columnSchema.type !== driver.normalizeType(columnMetadata) ||
                    columnSchema.comment !== columnMetadata.comment ||
                    (!columnSchema.isGenerated && !this.compareDefaultValues(driver.normalizeDefault(columnMetadata), columnSchema.default)) || // we included check for generated here, because generated columns already can have default values
                    columnSchema.isNullable !== columnMetadata.isNullable ||
                    columnSchema.isUnique !== driver.normalizeIsUnique(columnMetadata) ||
                    // columnSchema.isPrimary !== columnMetadata.isPrimary ||
                    columnSchema.isGenerated !== columnMetadata.isGenerated ||
                    !this.compareColumnLengths(driver, columnSchema, columnMetadata);
        });
    }

    findColumnByName(name: string): ColumnSchema|undefined {
        return this.columns.find(column => column.name === name);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Compare column lengths only if the datatype supports it.
     */

    private compareColumnLengths(driver: Driver, columnSchema: ColumnSchema, columnMetadata: ColumnMetadata): boolean {

        const normalizedColumn = driver.normalizeType(columnMetadata) as ColumnType;
        if (driver.withLengthColumnTypes.indexOf(normalizedColumn) !== -1) {
            let metadataLength = driver.getColumnLength(columnMetadata);

            // if we found something to compare with then do it, else skip it
            // use use case insensitive comparison to catch "MAX" vs "Max" case
            if (metadataLength)
                return columnSchema.length.toLowerCase() === metadataLength.toLowerCase();
        }

        return true;

    }    

    /**
     * Checks if "DEFAULT" values in the column metadata and in the database schema are equal.
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
     * Creates table schema from a given entity metadata.
     *
     * todo: need deeper implementation
     */
    static create(entityMetadata: EntityMetadata, driver: Driver) {
        const tableSchema = new TableSchema(entityMetadata.tableName);
        tableSchema.engine = entityMetadata.engine;
        tableSchema.database = entityMetadata.database;
        tableSchema.schema = entityMetadata.schema;
        entityMetadata.columns.forEach(column => {
            const columnSchema = ColumnSchema.create(column, 
                driver.normalizeType(column), 
                driver.normalizeDefault(column),
                driver.getColumnLength(column)); 
            tableSchema.columns.push(columnSchema);
        });

        return tableSchema;
    }

}