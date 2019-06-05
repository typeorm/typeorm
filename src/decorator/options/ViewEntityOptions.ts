/**
 * Describes all entity view's options.
 */
import {Connection, SelectQueryBuilder} from "../..";

export interface ViewEntityOptions {

    /**
     * View name.
     * If not specified then naming strategy will generate view name from class name.
     */
    name?: string;

    /**
     * View expression.
     */
    expression?: string|((connection: Connection) => SelectQueryBuilder<any>);

    /**
     * Database name. Used in Mysql and Sql Server.
     */
    database?: string;

    /**
     * Schema name. Used in Postgres and Sql Server.
     */
    schema?: string;
}
