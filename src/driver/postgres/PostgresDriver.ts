import {Driver} from "../Driver";
import {ConnectionIsNotSetError} from "../error/ConnectionIsNotSetError";
import {DriverOptions} from "../DriverOptions";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {DatabaseConnection} from "../DatabaseConnection";
import {DriverPackageNotInstalledError} from "../error/DriverPackageNotInstalledError";
import {DriverUtils} from "../DriverUtils";
import {ColumnTypes} from "../../metadata/types/ColumnTypes";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {Logger} from "../../logger/Logger";
import {PostgresQueryRunner} from "./PostgresQueryRunner";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {DriverOptionNotSetError} from "../error/DriverOptionNotSetError";
import {DataTransformationUtils} from "../../util/DataTransformationUtils";
import {PlatformTools} from "../../platform/PlatformTools";
import {NamingStrategyInterface} from "../../naming-strategy/NamingStrategyInterface";

// todo(tests):
// check connection with url
// check if any of required option is not set exception to be thrown
//

/**
 * Organizes communication with PostgreSQL DBMS.
 */
export class PostgresDriver implements Driver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Naming strategy used in the connection where this driver is used.
     */
    namingStrategy: NamingStrategyInterface;

    /**
     * Driver connection options.
     */
    readonly options: DriverOptions;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Postgres library.
     */
    protected postgres: any;

    /**
     * Connection to postgres database.
     */
    protected databaseConnection: DatabaseConnection|undefined;

    /**
     * Postgres pool.
     */
    protected pool: any;

    /**
     * Pool of database connections.
     */
    protected databaseConnectionPool: DatabaseConnection[] = [];

    /**
     * Logger used to log queries and errors.
     */
    protected logger: Logger;

    /**
     * Schema name. (Only used in Postgres)
     * default: "public"
     */
    public schemaName?: string;
    

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connectionOptions: DriverOptions, logger: Logger, postgres?: any) {

        this.options = DriverUtils.buildDriverOptions(connectionOptions);
        this.logger = logger;
        this.postgres = postgres;
        this.schemaName = connectionOptions.schemaName || "public";

        // validate options to make sure everything is set
        if (!this.options.host)
            throw new DriverOptionNotSetError("host");
        if (!this.options.username)
            throw new DriverOptionNotSetError("username");
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");

        // if postgres package instance was not set explicitly then try to load it
        if (!postgres)
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
            host: this.options.host,
            user: this.options.username,
            password: this.options.password,
            database: this.options.database,
            port: this.options.port
        }, this.options.extra || {});

        // pooling is enabled either when its set explicitly to true,
        // either when its not defined at all (e.g. enabled by default)
        if (this.options.usePool === undefined || this.options.usePool === true) {
            this.pool = new this.postgres.Pool(options);
            return Promise.resolve();

        } else {
            return new Promise<void>((ok, fail) => {
                this.databaseConnection = {
                    id: 1,
                    connection: new this.postgres.Client(options),
                    isTransactionActive: false
                };
                this.databaseConnection.connection.connect((err: any) => {
                    if (err) {
                        fail(err);
                    } else {
                        this.databaseConnection!.connection.query(`SET search_path TO '${this.schemaName}', 'public';`, (err: any, result: any) => {
                            if (err) {
                                this.logger.logFailedQuery(`SET search_path TO '${this.schemaName}', 'public';`);
                                this.logger.logQueryError(err);
                                fail(err);
                            } else {
                                ok();
                            }
                        });
                    }
                });
            });
        }
    }

    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void> {
        if (!this.databaseConnection && !this.pool)
            throw new ConnectionIsNotSetError("postgres");

        return new Promise<void>((ok, fail) => {
            const handler = (err: any) => err ? fail(err) : ok();

            if (this.databaseConnection) {
                this.databaseConnection.connection.end(/*handler*/); // todo: check if it can emit errors
                this.databaseConnection = undefined;
            }

            if (this.pool) {
                this.databaseConnectionPool.forEach(dbConnection => {
                    if (dbConnection && dbConnection.releaseCallback) {
                        dbConnection.releaseCallback();
                    }
                });
                this.pool.end(handler);
                this.pool = undefined;
                this.databaseConnectionPool = [];
            }

            ok();
        });
    }

    /**
     * Creates a query runner used for common queries.
     */
    async createQueryRunner(): Promise<QueryRunner> {
        if (!this.databaseConnection && !this.pool)
            return Promise.reject(new ConnectionIsNotSetError("postgres"));

        const databaseConnection = await this.retrieveDatabaseConnection();
        return new PostgresQueryRunner(databaseConnection, this, this.logger);
    }

    /**
     * Access to the native implementation of the database.
     */
    nativeInterface() {
        return {
            driver: this.postgres,
            connection: this.databaseConnection ? this.databaseConnection.connection : undefined,
            pool: this.pool
        };
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, column: ColumnMetadata): any {
        if (value === null || value === undefined)
            return null;

        switch (column.type) {
            case ColumnTypes.BOOLEAN:
                return value === true ? 1 : 0;

            case ColumnTypes.DATE:
                return DataTransformationUtils.mixedDateToDateString(value);

            case ColumnTypes.TIME:
                return DataTransformationUtils.mixedDateToTimeString(value);

            case ColumnTypes.DATETIME:
                if (column.localTimezone) {
                    return DataTransformationUtils.mixedDateToDatetimeString(value);
                } else {
                    return DataTransformationUtils.mixedDateToUtcDatetimeString(value);
                }

            case ColumnTypes.JSON:
            case ColumnTypes.JSONB:
                return JSON.stringify(value);

            case ColumnTypes.SIMPLE_ARRAY:
                return DataTransformationUtils.simpleArrayToString(value);
        }

        return value;
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        switch (columnMetadata.type) {
            case ColumnTypes.BOOLEAN:
                return value ? true : false;

            case ColumnTypes.DATETIME:
                return DataTransformationUtils.normalizeHydratedDate(value, columnMetadata.localTimezone === true);

            case ColumnTypes.TIME:
                return DataTransformationUtils.mixedTimeToString(value);

            case ColumnTypes.JSON:
            case ColumnTypes.JSONB:
                // pg(pg-types) have done JSON.parse conversion
                // https://github.com/brianc/node-pg-types/blob/ed2d0e36e33217b34530727a98d20b325389e73a/lib/textParsers.js#L170
                return value;

            case ColumnTypes.SIMPLE_ARRAY:
                return DataTransformationUtils.stringToSimpleArray(value);
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
            } else {
                builtParameters.push(value);
            }
            return "$" + builtParameters.length;
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, builtParameters];
    }

    /**
     * Escapes a column name.
     */
    escapeColumnName(columnName: string): string {
        return "\"" + columnName + "\"";
    }

    /**
     * Escapes an alias.
     */
    escapeAliasName(aliasName: string): string {
        return "\"" + aliasName + "\"";
    }

    /**
     * Escapes a table name.
     */
    escapeTableName(tableName: string): string {
        return "\"" + tableName + "\"";
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Retrieves a new database connection.
     * If pooling is enabled then connection from the pool will be retrieved.
     * Otherwise active connection will be returned.
     */
    protected retrieveDatabaseConnection(): Promise<DatabaseConnection> {
        if (this.pool) {
            return new Promise((ok, fail) => {
                this.pool.connect((err: any, connection: any, release: Function) => {
                    if (err) {
                        fail(err);
                        return;
                    }

                    let dbConnection = this.databaseConnectionPool.find(dbConnection => dbConnection.connection === connection);
                    if (!dbConnection) {
                        dbConnection = {
                            id: this.databaseConnectionPool.length,
                            connection: connection,
                            isTransactionActive: false
                        };
                        this.databaseConnectionPool.push(dbConnection);
                    }
                    dbConnection.releaseCallback = () => {
                        if (dbConnection) {
                            this.databaseConnectionPool.splice(this.databaseConnectionPool.indexOf(dbConnection), 1);
                        }
                        release();
                        return Promise.resolve();
                    };
                    dbConnection.connection.query(`SET search_path TO '${this.schemaName}', 'public';`, (err: any) => {
                        if (err) {
                            this.logger.logFailedQuery(`SET search_path TO '${this.schemaName}', 'public';`);
                            this.logger.logQueryError(err);
                            fail(err);
                        } else {
                            ok(dbConnection);
                        }
                    });
                });
            });
        }

        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection);

        throw new ConnectionIsNotSetError("postgres");
    }

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