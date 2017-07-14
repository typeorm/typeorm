import {Driver} from "../Driver";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {SqliteQueryRunner} from "./SqliteQueryRunner";
import {DriverOptionNotSetError} from "../../error/DriverOptionNotSetError";
import {DateUtils} from "../../util/DateUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {SqliteConnectionOptions} from "./SqliteConnectionOptions";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {DataTypeDefaults} from "../types/DataTypeDefaults";
import {ColumnSchema} from "../../schema-builder/schema/ColumnSchema";

/**
 * Organizes communication with sqlite DBMS.
 */
export class SqliteDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection used by driver.
     */
    connection: Connection;

    /**
     * Connection options.
     */
    options: SqliteConnectionOptions;

    /**
     * SQLite underlying library.
     */
    sqlite: any;

    /**
     * Sqlite has a single QueryRunner because it works on a single database connection.
     */
    queryRunner?: QueryRunner;

    /**
     * Real database connection with sqlite database.
     */
    databaseConnection: any;

    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults;

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

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
        "datetime",
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
    };

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        this.connection = connection;
        this.options = connection.options as SqliteConnectionOptions;

        // validate options to make sure everything is set
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        // load sqlite package
        this.loadDependencies();
    }

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
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner() {
        if (!this.queryRunner)
            this.queryRunner = new SqliteQueryRunner(this);

        return this.queryRunner;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean || columnMetadata.type === "boolean") {
            return value === true ? 1 : 0;

        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedDateToTimeString(value);

        } else if (columnMetadata.type === "datetime") {
            return DateUtils.mixedDateToUtcDatetimeString(value); // to string conversation needs because SQLite stores fate as integer number, when date came as Object

        } else if (columnMetadata.type === "simple-array") {
            return DateUtils.simpleArrayToString(value);
        }

        return value;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean || columnMetadata.type === "boolean") {
            return value ? true : false;

        } else if (columnMetadata.type === "datetime") {
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
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral): [string, any[]] {
        if (!parameters || !Object.keys(parameters).length)
            return [sql, []];

        const builtParameters: any[] = [];
        const keys = Object.keys(parameters).map(parameter => "(:" + parameter + "\\b)").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string): string => {
            const value = parameters[key.substr(1)];
            if (value instanceof Array) {
                return value.map((v: any) => {
                    builtParameters.push(v);
                    return "$" + builtParameters.length;
                }).join(", ");

            } else if (value instanceof Function) {
                return value();

            } else {
                builtParameters.push(value);
                return "$" + builtParameters.length;
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
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: { type?: ColumnType, length?: number, precision?: number, scale?: number }): string {
        let type = "";
        if (column.type === Number || column.type === "int") {
            type += "integer";

        } else if (column.type === String) {
            type += "varchar";

        } else if (column.type === Date) {
            type += "datetime";

        } else if ((column.type as any) === Buffer) {
            type += "blob";

        } else if (column.type === Boolean) {
            type += "boolean";

        } else if (column.type === "simple-array") {
            type += "text";

        } else {
            type += column.type;
        }

        return type;
    }

    /**
     * Normalizes "default" value of the column.
     */
    normalizeDefault(column: ColumnMetadata): string {
        if (typeof column.default === "number") {
            return "" + column.default;

        } else if (typeof column.default === "boolean") {
            return column.default === true ? "1" : "0";

        } else if (typeof column.default === "function") {
            return column.default();

        } else if (typeof column.default === "string") {
            return `'${column.default}'`;

        } else {
            return column.default;
        }
    }

    createFullType(column: ColumnSchema): string {
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
            type +=  "(" + this.dataTypeDefaults[column.type].length + ")";
        }

        if (column.isArray)
            type += " array";

        return type;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     */
    protected createDatabaseConnection() {
        return new Promise<void>((ok, fail) => {
            const databaseConnection = new this.sqlite.Database(this.options.database, (err: any) => {
                if (err) return fail(err);

                // we need to enable foreign keys in sqlite to make sure all foreign key related features
                // working properly. this also makes onDelete to work with sqlite.
                databaseConnection.run(`PRAGMA foreign_keys = ON;`, (err: any, result: any) => {
                    if (err) return fail(err);
                    ok(databaseConnection);
                });
            });
        });
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            this.sqlite = PlatformTools.load("sqlite3").verbose();

        } catch (e) {
            throw new DriverPackageNotInstalledError("SQLite", "sqlite3");
        }
    }

}