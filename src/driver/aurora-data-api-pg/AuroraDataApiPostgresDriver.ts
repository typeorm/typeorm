/**
 * Organizes communication with PostgreSQL DBMS.
 */
import {Connection} from "../../connection/Connection";
import {PostgresDriver} from "../postgres/PostgresDriver";
import {AuroraDataApiPostgresConnectionOptions} from "./AuroraDataApiPostgresConnectionOptions";
import {AuroraDataApiPostgresQueryRunner} from "./AuroraDataApiPostgresQueryRunner";
import {PlatformTools} from "../../platform/PlatformTools";

abstract class PostgresWrapper extends PostgresDriver {
    options: any;

    abstract createQueryRunner(mode: "master"|"slave"): any;
}

export class AuroraDataApiPostgresDriver extends PostgresWrapper {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

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

        // load data-api package
        this.loadDependencies();

        this.client = new this.DataApiDriver(
            this.options.region,
            this.options.secretArn,
            this.options.resourceArn,
            this.options.database,
            (query: string, parameters?: any[]) => this.connection.logger.logQuery(query, parameters),
            this.options.serviceConfigOptions,
            this.options.formatOptions,
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
    createQueryRunner(mode: "master"|"slave" = "master") {
        return new AuroraDataApiPostgresQueryRunner(this, mode);
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        const { pg } = PlatformTools.load("typeorm-aurora-data-api-driver");

        this.DataApiDriver = pg;
    }

    /**
     * Executes given query.
     */
    protected executeQuery(connection: any, query: string) {
        return this.client.query(query);
    }

    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    async afterConnect(): Promise<void> {
        const extensionsMetadata = await this.checkMetadataForExtensions();

        if (extensionsMetadata.hasExtensions) {
            await this.enableExtensions(extensionsMetadata, this.connection);
        }

        return Promise.resolve();
    }
}
