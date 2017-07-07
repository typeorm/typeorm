import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../../error/ConnectionIsNotSetError";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {DriverUtils} from "../DriverUtils";
import {SqlServerQueryRunner} from "./SqlServerQueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DriverOptionNotSetError} from "../../error/DriverOptionNotSetError";
import {DateUtils} from "../../util/DateUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {SqlServerConnectionOptions} from "./SqlServerConnectionOptions";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";

/**
 * Organizes communication with SQL Server DBMS.
 */
export class SqlServerDriver implements Driver {

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
    options: SqlServerConnectionOptions;

    /**
     * SQL Server library.
     */
    mssql: any;

    /**
     * SQL Server pool.
     */
    connectionPool: any;

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Gets list of supported column data types by a driver.
     *
     * @see https://docs.microsoft.com/en-us/sql/t-sql/data-types/data-types-transact-sql
     */
    supportedDataTypes: ColumnType[] = [
        "bigint",
        "bit",
        "decimal",
        "int",
        "money",
        "numeric",
        "smallint",
        "smallmoney",
        "tinyint",
        "float",
        "real",
        "date",
        "datetime2",
        "datetime",
        "datetimeoffset",
        "smalldatetime",
        "time",
        "char",
        "text",
        "varchar",
        "nchar",
        "ntext",
        "nvarchar",
        "binary",
        "image",
        "varbinary",
        "cursor",
        "hierarchyid",
        "sql_variant",
        "table",
        "timestamp",
        "uniqueidentifier",
        "xml"
    ];

    /**
     * Orm has special columns and we need to know what database column types should be for those types.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "datetime",
        createDateDefault: "getdate()",
        updateDate: "datetime",
        updateDateDefault: "getdate()",
        version: "int",
        treeLevel: "int",
        migrationName: "varchar",
        migrationTimestamp: "bigint",
    };
    
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        this.connection = connection;
        this.options = connection.options as SqlServerConnectionOptions;
        Object.assign(connection.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way

        // validate options to make sure everything is set
        if (!this.options.host)
            throw new DriverOptionNotSetError("host");
        if (!this.options.username)
            throw new DriverOptionNotSetError("username");
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        // load mssql package
        this.loadDependencies();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    connect(): Promise<void> {

        // build connection options for the driver
        const options = Object.assign({}, {
            server: this.options.host,
            user: this.options.username,
            password: this.options.password,
            database: this.options.database,
            port: this.options.port
        }, this.options.extra || {});

        // set default useUTC option if it hasn't been set
        if (!options.options) options.options = { useUTC: false };
        else if (!options.options.useUTC) options.options.useUTC = false; 

        // pooling is enabled either when its set explicitly to true,
        // either when its not defined at all (e.g. enabled by default)
        return new Promise<void>((ok, fail) => {
            const connection = new this.mssql.ConnectionPool(options).connect((err: any) => {
                if (err) return fail(err);
                this.connectionPool = connection;
                ok();
            });
        });
    }

    /**
     * Closes connection with the database.
     */
    async disconnect(): Promise<void> {
        if (!this.connectionPool)
            return Promise.reject(new ConnectionIsNotSetError("mssql"));

        this.connectionPool.close();
        this.connectionPool = undefined;
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
        return new SqlServerQueryRunner(this);
    }

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     */
    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral): [string, any[]] {
        if (!parameters || !Object.keys(parameters).length)
            return [sql, []];
        const escapedParameters: any[] = [];
        const keys = Object.keys(parameters).map(parameter => "(:" + parameter + "\\b)").join("|");
        sql = sql.replace(new RegExp(keys, "g"), (key: string) => {
            const value = parameters[key.substr(1)];
            if (value instanceof Array) {
                return value.map((v: any) => {
                    escapedParameters.push(v);
                    return "@" + (escapedParameters.length - 1);
                }).join(", ");
            } else if (value instanceof Function) {
                return value();

            } else {
                escapedParameters.push(value);
                return "@" + (escapedParameters.length - 1);
            }
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters];
    }

    /**
     * Escapes a column name.
     */
    escape(columnName: string): string {
        return `"${columnName}"`;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean) {
            return value === true ? 1 : 0;

        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedDateToTimeString(value);

        } else if (columnMetadata.type === "datetime") {
            return DateUtils.mixedDateToUtcDatetimeString(value);

        } else if (columnMetadata.type === "json") {
            return JSON.stringify(value);

        } else if (columnMetadata.type === "simple-array") {
            return DateUtils.simpleArrayToString(value);
        }

        return value;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.type === Boolean) {
            return value ? true : false;

        } else if (columnMetadata.type === "datetime") {
            return DateUtils.normalizeHydratedDate(value);

        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedTimeToString(value);

        } else if (columnMetadata.type === "json") {
            return JSON.parse(value);

        } else if (columnMetadata.type === "simple-array") {
            return DateUtils.stringToSimpleArray(value);
        }

        return value;
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: { type?: ColumnType, length?: string|number, precision?: number, scale?: number, array?: string|boolean }): string {
        let type = "";
        if (column.type === Number) {
            type += "int";

        } else if (column.type === String) {
            type += "nvarchar";

        } else if (column.type === Date) {
            type += "datetime";

        } else if (column.type === Boolean) {
            type += "bit";

        } else if (column.type === Object) {
            type += "ntext";

        } else if (column.type === "simple-array") {
            type += "ntext";

        } else {
            type += column.type;
        }

        // make sure aliases to have original type names
        if (type === "integer")
            type = "int";

        if (column.length) {
            type += "(" + column.length + ")";

        } else if (column.precision && column.scale) {
            type += "(" + column.precision + "," + column.scale + ")";

        } else if (column.precision) {
            type += "(" + column.precision + ")";

        } else if (column.scale) {
            type += "(" + column.scale + ")";
        }

        // set default required length if those were not specified
        if (type === "varchar" || type === "nvarchar")
            type += "(255)";

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
            return "(" + column.default() + ")";

        } else if (typeof column.default === "string") {
            return `'${column.default}'`;

        } else {
            return column.default;
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            this.mssql = PlatformTools.load("mssql");

        } catch (e) { // todo: better error for browser env
            throw new DriverPackageNotInstalledError("SQL Server", "mssql");
        }
    }

}
