import {Driver} from "../Driver";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DateUtils} from "../../util/DateUtils";
import {Connection} from "../../connection/Connection";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {DataTypeDefaults} from "../types/DataTypeDefaults";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {BaseConnectionOptions} from "../../connection/BaseConnectionOptions";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {OrmUtils} from "../../util/OrmUtils";
import {ArrayParameter} from "../../query-builder/ArrayParameter";

/**
 * Organizes communication with sqlite DBMS.
 */
export abstract class AbstractSqliteDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by driver.
     */
    connection: Connection;

    /**
     * Sqlite has a single QueryRunner because it works on a single database connection.
     */
    queryRunner?: QueryRunner;

    /**
     * Real database connection with sqlite database.
     */
    databaseConnection: any;

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: BaseConnectionOptions;

    /**
     * Master database used to perform all write queries.
     */
    database?: string;

    /**
     * Indicates if replication is enabled.
     */
    isReplicated: boolean = false;

    /**
     * SQLite underlying library.
     */
    sqlite: any;

    /**
     * Indicates if tree tables are supported by this driver.
     */
    treeSupport = true;

    /**
     * Gets list of supported column data types by a driver.
     *
     * @see https://www.tutorialspoint.com/sqlite/sqlite_data_types.htm
     * @see https://sqlite.org/datatype3.html
     */
    supportedDataTypes: ColumnType[] = [
        "int",
        "integer",
        "tinyint",
        "smallint",
        "mediumint",
        "bigint",
        "unsigned big int",
        "int2",
        "int8",
        "integer",
        "character",
        "varchar",
        "varying character",
        "nchar",
        "native character",
        "nvarchar",
        "text",
        "clob",
        "text",
        "blob",
        "real",
        "double",
        "double precision",
        "float",
        "real",
        "numeric",
        "decimal",
        "boolean",
        "date",
        "time",
        "datetime"
    ];

    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[] = [
        "character",
        "varchar",
        "varying character",
        "nchar",
        "native character",
        "nvarchar",
        "text",
        "blob",
        "clob"
    ];
    
    /**
     * Orm has special columns and we need to know what database column types should be for those types.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "datetime",
        createDateDefault: "datetime('now')",
        updateDate: "datetime",
        updateDateDefault: "datetime('now')",
        version: "integer",
        treeLevel: "integer",
        migrationName: "varchar",
        migrationTimestamp: "bigint",
        cacheId: "int",
        cacheIdentifier: "varchar",
        cacheTime: "bigint",
        cacheDuration: "int",
        cacheQuery: "text",
        cacheResult: "text",
    };

    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        this.connection = connection;
        this.options = connection.options as BaseConnectionOptions;
    }

    // -------------------------------------------------------------------------
    // Public Abstract
    // -------------------------------------------------------------------------

    /**
     * Creates a query runner used to execute database queries.
     */
    abstract createQueryRunner(mode: "master"|"slave"): QueryRunner;

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<void> {
        this.databaseConnection = await this.createDatabaseConnection();
    }

    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    afterConnect(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.queryRunner = undefined;
            this.databaseConnection.close((err: any) => err ? fail(err) : ok());
        });
    }

    /**
     * Creates a schema builder used to build and sync a schema.
     */
    createSchemaBuilder() {
        return new RdbmsSchemaBuilder(this.connection);
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = columnMetadata.transformer.to(value);

        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean || columnMetadata.type === "boolean") {
            return value === true ? 1 : 0;

        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedDateToTimeString(value);

        } else if (columnMetadata.type === "datetime" || columnMetadata.type === Date) {
            return DateUtils.mixedDateToUtcDatetimeString(value); // to string conversation needs because SQLite stores fate as integer number, when date came as Object

        } else if (columnMetadata.type === "simple-array") {
            return DateUtils.simpleArrayToString(value);
        }

        return value;
    }

    /**
     * Prepares given value to a value to be hydrated, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = columnMetadata.transformer.from(value);

        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean || columnMetadata.type === "boolean") {
            return value ? true : false;

        } else if (columnMetadata.type === "datetime" || columnMetadata.type === Date) {
            return DateUtils.normalizeHydratedDate(value);

        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedTimeToString(value);

        } else if (columnMetadata.type === "simple-array") {
            return DateUtils.stringToSimpleArray(value);
        }

        return value;
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral, nativeParameters: ObjectLiteral): [string, any[]] {
        const builtParameters: any[] = Object.keys(nativeParameters).map(key => nativeParameters[key]);
        if (!parameters || !Object.keys(parameters).length)
            return [sql, builtParameters];

        const keys = Object.keys(parameters).map(parameter => "(:" + parameter + "\\b)").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string): string => {
            let value = parameters[key.substr(1)];
            if (value instanceof Array) {
                return value.map((v: any) => {
                    builtParameters.push(v);
                    return "?";
                    // return "$" + builtParameters.length;
                }).join(", ");

            } else if (value instanceof Function) {
                return value();

            } else {
                if (value instanceof ArrayParameter) value = value.value;
                builtParameters.push(value);
                return "?";
                // return "$" + builtParameters.length;
            }
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, builtParameters];
    }

    /**
     * Escapes a column name.
     */
    escape(columnName: string): string {
        return "\"" + columnName + "\"";
    }

    /**
     * Build full table name with database name, schema name and table name.
     * E.g. "myDB"."mySchema"."myTable"
     *
     * Returns only simple table name because all inherited drivers does not supports schema and database.
     */
    buildTableName(tableName: string, schema?: string, database?: string): string {
        return tableName;
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: { type?: ColumnType, length?: number | string, precision?: number, scale?: number }): string {
        if (column.type === Number || column.type === "int") {
            return "integer";

        } else if (column.type === String) {
            return "varchar";

        } else if (column.type === Date) {
            return "datetime";

        } else if (column.type === Boolean) {
            return "boolean";

        } else if (column.type === "uuid") {
            return "varchar";

        } else if (column.type === "simple-array") {
            return "text";

        } else {
            return column.type as string || "";
        }
    }

    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(defaultValue: string): string {
        if (typeof defaultValue === "number") {
            return "" + defaultValue;

        } else if (typeof defaultValue === "boolean") {
            return defaultValue === true ? "1" : "0";

        } else if (typeof defaultValue === "function") {
            return defaultValue();

        } else if (typeof defaultValue === "string") {
            return `'${defaultValue}'`;

        } else {
            return defaultValue;
        }
    }

    /**
     * Normalizes "isUnique" value of the column.
     */
    normalizeIsUnique(column: ColumnMetadata): boolean {
        return column.isUnique;
    }
    
    /**
     * Calculates column length taking into account the default length values.
     */
    getColumnLength(column: ColumnMetadata): string {
        
        if (column.length)
            return column.length;

        const normalizedType = this.normalizeType(column) as string;
        if (this.dataTypeDefaults && this.dataTypeDefaults[normalizedType] && this.dataTypeDefaults[normalizedType].length)
            return this.dataTypeDefaults[normalizedType].length!.toString();       

        return "";
    }
    
    /**
     * Normalizes "default" value of the column.
     */
    createFullType(column: TableColumn): string {
        let type = column.type;

        if (column.length) {
            type += "(" + column.length + ")";
        } else if (column.precision && column.scale) {
            type += "(" + column.precision + "," + column.scale + ")";
        } else if (column.precision) {
            type +=  "(" + column.precision + ")";
        } else if (column.scale) {
            type +=  "(" + column.scale + ")";
        } else  if (this.dataTypeDefaults && this.dataTypeDefaults[column.type] && this.dataTypeDefaults[column.type].length) {
            type +=  "(" + this.dataTypeDefaults[column.type].length!.toString() + ")";
        }

        if (column.isArray)
            type += " array";

        return type;
    }

    /**
     * Obtains a new database connection to a master server.
     * Used for replication.
     * If replication is not setup then returns default connection's database connection.
     */
    obtainMasterConnection(): Promise<any> {
        return Promise.resolve();
    }

    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection(): Promise<any> {
        return Promise.resolve();
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(metadata: EntityMetadata, insertResult: any) {
        const generatedMap = metadata.generatedColumns.reduce((map, generatedColumn) => {
            let value: any;
            if (generatedColumn.generationStrategy === "increment" && insertResult) {
                value = insertResult;
            // } else if (generatedColumn.generationStrategy === "uuid") {
            //     value = insertValue[generatedColumn.databaseName];
            }

            if (!value) return map;
            return OrmUtils.mergeDeep(map, generatedColumn.createValueMap(value));
        }, {} as ObjectLiteral);

        return Object.keys(generatedMap).length > 0 ? generatedMap : undefined;
    }

    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported(): boolean {
        return false;
    }

    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported(): boolean {
        return false;
    }

    /**
     * Creates an escaped parameter.
     */
    createParameter(parameterName: string, index: number): string {
        // return "$" + (index + 1);
        return "?";
        // return "$" + parameterName;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     */
    protected createDatabaseConnection() {
        throw new Error("Do not use AbstractSqlite directly, it has to be used with one of the sqlite drivers");
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        // dependencies have to be loaded in the specific driver
    }

}