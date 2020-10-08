import {Driver} from "../Driver";
import {PostgresDriver} from "../postgres/PostgresDriver";
import {PlatformTools} from "../../platform/PlatformTools";
import {Connection} from "../../connection/Connection";
import {AuroraDataApiPostgresConnectionOptions} from "../aurora-data-api-pg/AuroraDataApiPostgresConnectionOptions";
import {AuroraDataApiPostgresQueryRunner} from "../aurora-data-api-pg/AuroraDataApiPostgresQueryRunner";
import {ReplicationMode} from "../types/ReplicationMode";

abstract class PostgresWrapper extends PostgresDriver {
    options: any;

    abstract createQueryRunner(mode: ReplicationMode): any;
}

export class AuroraDataApiPostgresDriver extends PostgresWrapper implements Driver {

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
    createQueryRunner(mode: ReplicationMode) {
        return new AuroraDataApiPostgresQueryRunner(
            this,
            new this.DataApiDriver(
                this.options.region,
                this.options.secretArn,
                this.options.resourceArn,
                this.options.database,
                (query: string, parameters?: any[]) => this.connection.logger.logQuery(query, parameters),
                this.options.serviceConfigOptions,
                this.options.formatOptions,
            ),
            mode
        );
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
        return this.connection.query(query);
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
