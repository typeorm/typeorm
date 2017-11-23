import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../../error/ConnectionIsNotSetError";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {DriverPackageNotInstalledError} from "../../error/DriverPackageNotInstalledError";
import {DriverUtils} from "../DriverUtils";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {PostgresQueryRunner} from "./PostgresQueryRunner";
import {DateUtils} from "../../util/DateUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {RdbmsSchemaBuilder} from "../../schema-builder/RdbmsSchemaBuilder";
import {PostgresConnectionOptions} from "./PostgresConnectionOptions";
import {MappedColumnTypes} from "../types/MappedColumnTypes";
import {ColumnType} from "../types/ColumnTypes";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {DataTypeDefaults} from "../types/DataTypeDefaults";
import {TableColumn} from "../../schema-builder/table/TableColumn";
import {PostgresConnectionCredentialsOptions} from "./PostgresConnectionCredentialsOptions";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {OrmUtils} from "../../util/OrmUtils";
import {ArrayParameter} from "../../query-builder/ArrayParameter";

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
     * Postgres underlying library.
     */
    postgres: any;

    /**
     * Pool for master database.
     */
    master: any;

    /**
     * Pool for slave databases.
     * Used in replication.
     */
    slaves: any[] = [];

    /**
     * We store all created query runners because we need to release them.
     */
    connectedQueryRunners: QueryRunner[] = [];

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: PostgresConnectionOptions;

    /**
     * Master database used to perform all write queries.
     */
    database?: string;

    /**
     * Indicates if replication is enabled.
     */
    isReplicated: boolean = false;

    /**
     * Indicates if tree tables are supported by this driver.
     */
    treeSupport = true;

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
        "money",
        "character varying",
        "varchar",
        "character",
        "char",
        "text",
        "citext",
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
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[] = [
        "character varying",
        "varchar",
        "character",
        "char",
        "bit",
        "bit varying"
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
    dataTypeDefaults: DataTypeDefaults = {
        "character varying": { length: 255 },
        "varchar": { length: 255 }
    };

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        this.connection = connection;
        this.options = connection.options as PostgresConnectionOptions;
        this.isReplicated = this.options.replication ? true : false;

        // load postgres package
        this.loadDependencies();

        // Object.assign(this.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way
        // validate options to make sure everything is set
        // todo: revisit validation with replication in mind
        // if (!this.options.host)
        //     throw new DriverOptionNotSetError("host");
        // if (!this.options.username)
        //     throw new DriverOptionNotSetError("username");
        // if (!this.options.database)
        //     throw new DriverOptionNotSetError("database");
    }

    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    async connect(): Promise<void> {

        if (this.options.replication) {
            this.slaves = await Promise.all(this.options.replication.slaves.map(slave => {
                return this.createPool(this.options, slave);
            }));
            this.master = await this.createPool(this.options, this.options.replication.master);
            this.database = this.options.replication.master.database;

        } else {
            this.master = await this.createPool(this.options, this.options);
            this.database = this.options.database;
        }
    }

    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    async afterConnect(): Promise<void> {
        const hasUuidColumns = this.connection.entityMetadatas.some(metadata => {
            return metadata.generatedColumns.filter(column => column.generationStrategy === "uuid").length > 0;
        });
        const hasCitextColumns = this.connection.entityMetadatas.some(metadata => {
            return metadata.columns.filter(column => column.type === "citext").length > 0;
        });

        if (hasUuidColumns || hasCitextColumns) {
            await Promise.all([this.master, ...this.slaves].map(pool => {
                return new Promise((ok, fail) => {
                    pool.connect(async (err: any, connection: any, release: Function) => {
                        if (err) return fail(err);
                        if (hasUuidColumns)
                            await this.executeQuery(connection, `CREATE extension IF NOT EXISTS "uuid-ossp"`);
                        if (hasCitextColumns)
                            await this.executeQuery(connection, `CREATE extension IF NOT EXISTS "citext"`);

                        release();
                        ok();
                    });
                });
            }));
        }

        return Promise.resolve();
    }

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        if (!this.master)
            return Promise.reject(new ConnectionIsNotSetError("postgres"));

        await this.closePool(this.master);
        await Promise.all(this.slaves.map(slave => this.closePool(slave)));
        this.master = undefined;
        this.slaves = [];
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
    createQueryRunner(mode: "master"|"slave" = "master") {
        return new PostgresQueryRunner(this, mode);
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = columnMetadata.transformer.to(value);

        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean) {
            return value === true ? 1 : 0;

        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value);

        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedDateToTimeString(value);

        } else if (columnMetadata.type === "datetime"
            || columnMetadata.type === Date
            || columnMetadata.type === "timestamp"
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
        if (columnMetadata.transformer)
            value = columnMetadata.transformer.from(value);

        if (value === null || value === undefined)
            return value;

        if (columnMetadata.type === Boolean) {
            return value ? true : false;

        } else if (columnMetadata.type === "datetime"
            || columnMetadata.type === Date
            || columnMetadata.type === "timestamp"
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
                    return "$" + builtParameters.length;
                }).join(", ");

            } else if (value instanceof Function) {
                return value();

            } else {
                if (value instanceof ArrayParameter) value = value.value;
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
     * Build full table name with schema name and table name.
     * E.g. "mySchema"."myTable"
     */
    buildTableName(tableName: string, schema?: string): string {
        return schema ? `${schema}.${tableName}` : tableName;
    }

    /**
     * Creates a database type from a given column metadata.
     */
    normalizeType(column: { type?: ColumnType, length?: number | string, precision?: number, scale?: number, isArray?: boolean }): string {
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

        } else if (type === "citext") {
            type = "citext";

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
    normalizeDefault(defaultValue: string): string {
        if (typeof defaultValue === "number") {
            return "" + defaultValue;

        } else if (typeof defaultValue === "boolean") {
            return defaultValue === true ? "true" : "false";

        } else if (typeof defaultValue === "function") {
            return defaultValue();

        } else if (typeof defaultValue === "string") {
            return `'${defaultValue}'`;

        } else if (typeof defaultValue === "object") {
            return `'${JSON.stringify(defaultValue)}'`;

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

        if (column.type === "time without time zone") {
            type = "TIME" + (column.precision ? "(" + column.precision + ")" : "");

        } else if (column.type === "time with time zone") {
            type = "TIME" + (column.precision ? "(" + column.precision + ")" : "") + " WITH TIME ZONE";

        } else if (column.type === "timestamp without time zone") {
            type = "TIMESTAMP" + (column.precision ? "(" + column.precision + ")" : "");

        } else if (column.type === "timestamp with time zone") {
            type = "TIMESTAMP" + (column.precision ? "(" + column.precision + ")" : "") + " WITH TIME ZONE";
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
        return new Promise((ok, fail) => {
            this.master.connect((err: any, connection: any, release: any) => {
                err ? fail(err) : ok([connection, release]);
            });
        });
    }

    /**
     * Obtains a new database connection to a slave server.
     * Used for replication.
     * If replication is not setup then returns master (default) connection's database connection.
     */
    obtainSlaveConnection(): Promise<any> {
        if (!this.slaves.length)
            return this.obtainMasterConnection();

        return new Promise((ok, fail) => {
            const random = Math.floor(Math.random() * this.slaves.length);
            this.slaves[random].connect((err: any, connection: any, release: any) => {
                err ? fail(err) : ok([connection, release]);
            });
        });
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(metadata: EntityMetadata, insertResult: ObjectLiteral) {
        if (!insertResult)
            return undefined;

        return Object.keys(insertResult).reduce((map, key) => {
            const column = metadata.findColumnWithDatabaseName(key);
            if (column) {
                OrmUtils.mergeDeep(map, column.createValueMap(insertResult[key]));
            }
            return map;
        }, {} as ObjectLiteral);
    }

    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     */
    isReturningSqlSupported(): boolean {
        return true;
    }

    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported(): boolean {
        return true;
    }

    /**
     * Creates an escaped parameter.
     */
    createParameter(parameterName: string, index: number): string {
        return "$" + (index + 1);
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
            try {
                const pgNative = PlatformTools.load("pg-native");
                if (pgNative && this.postgres.native) this.postgres = this.postgres.native;
                
            } catch (e) { }

        } catch (e) { // todo: better error for browser env
            throw new DriverPackageNotInstalledError("Postgres", "pg");
        }
    }

    /**
     * Creates a new connection pool for a given database credentials.
     */
    protected async createPool(options: PostgresConnectionOptions, credentials: PostgresConnectionCredentialsOptions): Promise<any> {

        credentials = Object.assign(credentials, DriverUtils.buildDriverOptions(credentials)); // todo: do it better way

        // build connection options for the driver
        const connectionOptions = Object.assign({}, {
            host: credentials.host,
            user: credentials.username,
            password: credentials.password,
            database: credentials.database,
            port: credentials.port,
            ssl: credentials.ssl
        }, options.extra || {});

        // create a connection pool
        const pool = new this.postgres.Pool(connectionOptions);

        return new Promise((ok, fail) => {
            pool.connect((err: any, connection: any, release: Function) => {
                if (err) return fail(err);
                release();
                ok(pool);
            });
        });
    }

    /**
     * Closes connection pool.
     */
    protected async closePool(pool: any): Promise<void> {
        await Promise.all(this.connectedQueryRunners.map(queryRunner => queryRunner.release()));
        return new Promise<void>((ok, fail) => {
            pool.end((err: any) => err ? fail(err) : ok());
        });
    }

    /**
     * Executes given query.
     */
    protected executeQuery(connection: any, query: string) {
        return new Promise((ok, fail) => {
            connection.query(query, (err: any, result: any) => {
                if (err) return fail(err);
                ok(result);
            });
        });
    }

}