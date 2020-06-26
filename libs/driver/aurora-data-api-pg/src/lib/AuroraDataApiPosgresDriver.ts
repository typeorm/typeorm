import { PostgresDriver } from '@typeorm/driver-postgres';
import { Connection } from '@typeorm/core';
import { AuroraDataApiPostgresConnectionOptions } from './AuroraDataApiPostgresConnectionOptions';
import { AuroraDataApiPostgresQueryRunner } from './AuroraDataApiPostgresQueryRunner';
import { pg } from 'typeorm-aurora-data-api-driver';

abstract class PostgresWrapper extends PostgresDriver {
    options: any;

    abstract createQueryRunner(mode: "master" | "slave"): any;
}

/**
 * Organizes communication with PostgreSQL DBMS.
 */
export class AuroraDataApiPostgresDriver extends PostgresWrapper {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    type = 'AuroraDataApiPostgresDriver';

    /**
     * Connection used by driver.
     */
    connection: Connection;

    /**
     * Aurora Data API underlying library.
     */
    DataApiDriver: any;

    client: any;

    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Connection options.
     */
    options: AuroraDataApiPostgresConnectionOptions;

    /**
     * Master database used to perform all write queries.
     */
    database?: string;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        super();
        this.connection = connection;
        this.options = connection.options as AuroraDataApiPostgresConnectionOptions;
        this.isReplicated = false;

        this.client = pg(
            this.options.region,
            this.options.secretArn,
            this.options.resourceArn,
            this.options.database,
            (query: string, parameters?: any[]) => this.connection.logger.logQuery(query, parameters),
            this.options.serviceConfigOptions
        );
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
    }

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: "master" | "slave" = "master") {
        return new AuroraDataApiPostgresQueryRunner(this, mode);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Executes given query.
     */
    protected executeQuery(connection: any, query: string) {
        return this.client.query(query);
    }

}
