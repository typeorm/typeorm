import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../../error/ConnectionIsNotSetError";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {DriverUtils} from "../DriverUtils";
import {MysqlQueryRunner} from "./MysqlQueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DriverOptionNotSetError} from "../../error/DriverOptionNotSetError";
import {DateUtils} from "../../util/DateUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {MysqlConnectionOptions} from "./MysqlConnectionOptions";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";

/**
 * Organizes communication with MySQL DBMS.
 */
export class MysqlDriver implements Driver {

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
    options: MysqlConnectionOptions;

    /**
     * Mysql underlying library.
     */
    mysql: any;

    /**
     * Database connection pool created by underlying driver.
     */
    pool: any;

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Gets list of supported column data types by a driver.
     *
     * @see https://www.tutorialspoint.com/mysql/mysql-data-types.htm
     * @see https://dev.mysql.com/doc/refman/5.7/en/data-types.html
     */
    supportedDataTypes: ColumnType[] = [
        "int",
        "tinyint",
        "smallint",
        "mediumint",
        "bigint",
        "float",
        "double",
        "decimal",
        "date",
        "datetime",
        "timestamp",
        "time",
        "year",
        "char",
        "varchar",
        "blob",
        "text",
        "tinyblob",
        "tinytext",
        "mediumblob",
        "mediumtext",
        "longblob",
        "longtext",
        "enum",
        "json"
    ];

    /**
     * ORM has special columns and we need to know what database column types should be for those columns.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "datetime",
        createDateDefault: "CURRENT_TIMESTAMP",
        updateDate: "datetime",
        updateDateDefault: "CURRENT_TIMESTAMP",
        version: "int",
        treeLevel: "int",
        migrationName: "varchar",
        migrationTimestamp: "bigint"
    };

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    
    constructor(connection: Connection) {
        this.connection = connection;
        this.options = connection.options as MysqlConnectionOptions;

        Object.assign(connection.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way

        // validate options to make sure everything is set
        if (!(this.options.host || (this.options.extra && this.options.extra.socketPath)))
            throw new DriverOptionNotSetError("socketPath and host");
        if (!this.options.username)
            throw new DriverOptionNotSetError("username");
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        // load mysql package
        this.loadDependencies();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<void> {

        // build connection options for the driver
        const options = Object.assign({}, {
            host: this.options.host,
            user: this.options.username,
            password: this.options.password,
            database: this.options.database,
            port: this.options.port
        }, this.options.extra || {});

        this.pool = this.mysql.createPool(options);
    }

    /**
     * Closes connection with the database.
     */
    disconnect(): Promise<void> {
        if (!this.pool)
            return Promise.reject(new ConnectionIsNotSetError("mysql"));

        return new Promise<void>((ok, fail) => {
            const handler = (err: any) => err ? fail(err) : ok();
            this.pool.end(handler);
            this.pool = undefined;
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
        return new MysqlQueryRunner(this);
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
            if (value instanceof Function) {
                return value();

            } else {
                escapedParameters.push(parameters[key.substr(1)]);
                return "?";
            }
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters];
    }

    /**
     * Escapes a column name.
     */
    escape(columnName: string): string {
        return "`" + columnName + "`";
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
    normalizeType(column: { type?: ColumnType, length?: string|number, precision?: number, scale?: number }): string {
        let type = "";
        if (column.type === Number) {
            type += "int";

        } else if (column.type === String) {
            type += "varchar";

        } else if (column.type === Date) {
            type += "datetime";

        } else if (column.type === Boolean) {
            type += "tinyint(1)";

        } else if (column.type === Object) {
            type += "text";

        } else if (column.type === "simple-array") {
            type += "text";

        } else {
            type += column.type;
        }

        // normalize shortcuts
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
        if (type === "varchar")
            type += "(255)";

        if (type === "int")
            type += "(11)";

        if (type === "tinyint")
            type += "(4)";

        if (type === "smallint")
            type += "(5)";

        if (type === "mediumint")
            type += "(9)";

        if (type === "bigint")
            type += "(20)";

        if (type === "year")
            type += "(4)";

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

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Loads all driver dependencies.
     */
    protected loadDependencies(): void {
        try {
            this.mysql = PlatformTools.load("mysql");  // try to load first supported package

        } catch (e) {
            try {
                this.mysql = PlatformTools.load("mysql2"); // try to load second supported package

            } catch (e) {
                throw new DriverPackageNotInstalledError("Mysql", "mysql");
            }
        }
    }

}