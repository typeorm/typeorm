import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../../error/ConnectionIsNotSetError";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {DriverUtils} from "../DriverUtils";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {PostgresQueryRunner} from "./PostgresQueryRunner";
import {DriverOptionNotSetError} from "../../error/DriverOptionNotSetError";
import {DateUtils} from "../../util/DateUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {PostgresConnectionOptions} from "./PostgresConnectionOptions";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {DataTypeDefaults} from "../types/DataTypeDefaults";

/**
 * Organizes communication with PostgreSQL DBMS.
 */
export class PostgresDriver implements Driver {

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
    options: PostgresConnectionOptions;

    /**
     * Postgres underlying library.
     */
    postgres: any;

    /**
     * Database connection pool created by underlying driver.
     */
    pool: any;

    /**
     * We store all created query runners because we need to release them.
     */
    connectedQueryRunners: QueryRunner[] = [];

    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults;

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Gets list of supported column data types by a driver.
     *
     * @see https://www.tutorialspoint.com/postgresql/postgresql_data_types.htm
     * @see https://www.postgresql.org/docs/9.2/static/datatype.html
     */
    supportedDataTypes: ColumnType[] = [
        "smallint",
        "integer",
        "bigint",
        "decimal",
        "numeric",
        "real",
        "double precision",
        "smallserial",
        "serial",
        "bigserial",
        "money",
        "character varying",
        "varchar",
        "character",
        "char",
        "text",
        "bytea",
        "bit",
        "bit varying",
        "timestamp",
        "timestamp without time zone",
        "timestamp with time zone",
        "date",
        "time",
        "time without time zone",
        "time with time zone",
        "interval",
        "boolean",
        "enum",
        "point",
        "line",
        "lseg",
        "box",
        "path",
        "polygon",
        "circle",
        "cidr",
        "inet",
        "macaddr",
        "tsvector",
        "tsquery",
        "uuid",
        "xml",
        "json",
        "jsonb"
    ];

    /**
     * Orm has special columns and we need to know what database column types should be for those types.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "timestamp",
        createDateDefault: "now()",
        updateDate: "timestamp",
        updateDateDefault: "now()",
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
        this.options = connection.options as PostgresConnectionOptions;

        Object.assign(this.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way

        // validate options to make sure everything is set
        if (!this.options.host)
            throw new DriverOptionNotSetError("host");
        if (!this.options.username)
            throw new DriverOptionNotSetError("username");
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        // load postgres package
        this.loadDependencies();
    }

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    connect(): Promise<void> {

        // build connection options for the driver
        const options = Object.assign({}, {
            host: this.options.host,
            user: this.options.username,
            password: this.options.password,
            database: this.options.database,
            port: this.options.port
        }, this.options.extra || {});

        // pooling is enabled either when its set explicitly to true,
        // either when its not defined at all (e.g. enabled by default)
        this.pool = new this.postgres.Pool(options);
        return Promise.resolve();
    }

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void> {
        if (!this.pool)
            return Promise.reject(new ConnectionIsNotSetError("postgres"));

        return new Promise<void>(async (ok, fail) => {
            const handler = (err: any) => err ? fail(err) : ok();

            // this is checked fact that postgres.pool.end do not release all non released connections
            await Promise.all(this.connectedQueryRunners.map(queryRunner => queryRunner.release()));
            this.pool.end(handler);
            this.pool = undefined;
            ok();
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
        return new PostgresQueryRunner(this);
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

        } else if (columnMetadata.type === "timestamp"
            || columnMetadata.type === "timestamp with time zone"
            || columnMetadata.type === "timestamp without time zone") {
            return DateUtils.mixedDateToDate(value, true);

        } else if (columnMetadata.type === "json" || columnMetadata.type === "jsonb") {
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
        if (value === null || value === undefined)
            return value;
            
        if (columnMetadata.type === Boolean) {
            return value ? true : false;

        } else if (columnMetadata.type === "timestamp"
            || columnMetadata.type === "timestamp with time zone"
            || columnMetadata.type === "timestamp without time zone") {
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
    normalizeType(column: { type?: ColumnType, length?: number, precision?: number, scale?: number, isArray?: boolean }): string {
        let type = "";
        if (column.type === Number) {
            type += "integer";

        } else if (column.type === String) {
            type += "character varying";

        } else if (column.type === Date) {
            type += "timestamp";

        } else if (column.type === Boolean) {
            type += "boolean";

        } else if (column.type === "simple-array") {
            type += "text";

        } else {
            type += column.type;
        }

        // normalize shortcuts
        if (type === "int" || type === "int4") {
            type = "integer";

        } else if (type === "int2") {
            type = "smallint";

        } else if (type === "int8") {
            type = "bigint";

        } else if (type === "decimal") {
            type = "numeric";

        } else if (type === "float8") {
            type = "double precision";

        } else if (type === "float4") {
            type = "real";

        } else if (type === "char") {
            type = "character";

        } else if (type === "varchar") {
            type = "character varying";

        } else if (type === "time") {
            type = "time without time zone";

        } else if (type === "timetz") {
            type = "time with time zone";

        } else if (type === "timestamptz") {
            type = "timestamp with time zone";

        } else if (type === "bool") {
            type = "boolean";

        } else if (type === "varbit") {
            type = "bit varying";

        } else if (type === "timestamp") {
            type = "timestamp without time zone";
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
            return column.default === true ? "true" : "false";

        } else if (typeof column.default === "function") {
            return column.default();

        } else if (typeof column.default === "string") {
            return `'${column.default}'`;

        } else if (typeof column.default === "object") {
            return `'${JSON.stringify(column.default)}'`;

        } else {
            return column.default;
        }
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Loads postgres query stream package.
     */
    loadStreamDependency() {
        try {
            return PlatformTools.load("pg-query-stream");

        } catch (e) { // todo: better error for browser env
            throw new Error(`To use streams you should install pg-query-stream package. Please run npm i pg-query-stream --save command.`);
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
            this.postgres = PlatformTools.load("pg");

        } catch (e) { // todo: better error for browser env
            throw new DriverPackageNotInstalledError("Postgres", "pg");
        }
    }

}