import { Connection as BrowserConnection, ConnectionOptions } from "@typeorm/browser-core";
import { ConnectionMetadataBuilder } from "./ConnectionMetadataBuilder";
import { DriverFactory } from '../driver/DriverFactory';
import { QueryResultCacheFactory } from '../cache/QueryResultCacheFactory';
import { LoggerFactory } from '../logger/LoggerFactory';

/**
 * Connection is a single database ORM connection to a specific database.
 * It's not required to be a database connection, depend on database type it can create connection pool.
 * You can have multiple connections to multiple databases in your application.
 */
export class Connection extends BrowserConnection {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: ConnectionOptions) {
        super(options, ConnectionMetadataBuilder, DriverFactory, QueryResultCacheFactory, LoggerFactory);
    }
}
