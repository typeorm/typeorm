import {DriverUtils} from "../DriverUtils";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {DriverOptionNotSetError} from "../../error/DriverOptionNotSetError";
import {WebsqlQueryRunner} from "./WebsqlQueryRunner";
import {Connection} from "../../connection/Connection";
import {WebSqlConnectionOptions} from "./WebSqlConnectionOptions";
import {AbstractSqliteDriver} from "../sqlite-abstract/AbstractSqliteDriver";

/**
 * Organizes communication with WebSQL in the browser.
 */
export class WebsqlDriver extends AbstractSqliteDriver {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: WebSqlConnectionOptions;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        super(connection);
        
        this.options = connection.options as WebSqlConnectionOptions;
        Object.assign(connection.options, DriverUtils.buildDriverOptions(connection.options)); // todo: do it better way
        this.database = this.options.database;

        // validate options to make sure everything is set
        // if (!this.options.host)
        //     throw new DriverOptionNotSetError("host");
        // if (!this.options.username)
        //     throw new DriverOptionNotSetError("username");
        if (!this.options.database)
            throw new DriverOptionNotSetError("database");
        // todo: what about extra options: version, description, size
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Closes connection with the database.
     */
    disconnect(): Promise<void> {
        return Promise.resolve();
        // if (!this.databaseConnection)
        //     throw new ConnectionIsNotSetError("websql");

        // return new Promise<void>((ok, fail) => {
            // const handler = (err: any) => err ? fail(err) : ok();
            // todo: find out how to close connection
            // ok();
        // });
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: "master"|"slave" = "master"): WebsqlQueryRunner {
        return new WebsqlQueryRunner(this);
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.type === "json") {
            return JSON.stringify(value);
        }

        return super.preparePersistentValue(value, columnMetadata);
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.type === "json") {
            return JSON.parse(value);
        }

        return super.prepareHydratedValue(value, columnMetadata);
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

            }
            // Websql doesn't support queries boolean values. Therefore 1 and 0 has to be used.
            else if ((typeof value) === "boolean") {
                escapedParameters.push((value ? 1 : 0));
                return "?";
            } else {
                escapedParameters.push(value);
                return "?";
            }
        }); // todo: make replace only in value statements, otherwise problems
        return [sql, escapedParameters];
    }

    /**
     * Escapes a column name.
     */
    escape(columnName: string): string {
        return columnName; // "`" + columnName + "`";
    }
}