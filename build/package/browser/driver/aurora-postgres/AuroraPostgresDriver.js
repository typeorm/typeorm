import { PostgresDriver } from "../postgres/PostgresDriver";
import { PlatformTools } from "../../platform/PlatformTools";
import { AuroraPostgresQueryRunner } from "./AuroraPostgresQueryRunner";
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers";
import { DriverUtils } from "../DriverUtils";
class PostgresWrapper extends PostgresDriver {
}
export class AuroraPostgresDriver extends PostgresWrapper {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        super();
        /**
         * Represent transaction support by this driver
         */
        this.transactionSupport = "nested";
        this.connection = connection;
        this.options = connection.options;
        this.isReplicated = false;
        // load data-api package
        this.loadDependencies();
        this.client = new this.DataApiDriver(this.options.region, this.options.secretArn, this.options.resourceArn, this.options.database, (query, parameters) => this.connection.logger.logQuery(query, parameters), this.options.serviceConfigOptions, this.options.formatOptions);
        this.database = DriverUtils.buildDriverOptions(this.options).database;
    }
    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------
    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    async connect() { }
    /**
     * Closes connection with database.
     */
    async disconnect() { }
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode) {
        return new AuroraPostgresQueryRunner(this, new this.DataApiDriver(this.options.region, this.options.secretArn, this.options.resourceArn, this.options.database, (query, parameters) => this.connection.logger.logQuery(query, parameters), this.options.serviceConfigOptions, this.options.formatOptions), mode);
    }
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value, columnMetadata) {
        if (this.options.formatOptions &&
            this.options.formatOptions.castParameters === false) {
            return super.preparePersistentValue(value, columnMetadata);
        }
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(columnMetadata.transformer, value);
        return this.client.preparePersistentValue(value, columnMetadata);
    }
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    prepareHydratedValue(value, columnMetadata) {
        if (this.options.formatOptions &&
            this.options.formatOptions.castParameters === false) {
            return super.prepareHydratedValue(value, columnMetadata);
        }
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);
        return this.client.prepareHydratedValue(value, columnMetadata);
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    loadDependencies() {
        const driver = this.options.driver ||
            PlatformTools.load("typeorm-aurora-data-api-driver");
        const { pg } = driver;
        this.DataApiDriver = pg;
    }
    /**
     * Executes given query.
     */
    executeQuery(connection, query) {
        return this.connection.query(query);
    }
    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    async afterConnect() {
        const extensionsMetadata = await this.checkMetadataForExtensions();
        if (extensionsMetadata.hasExtensions) {
            await this.enableExtensions(extensionsMetadata, this.connection);
        }
        return Promise.resolve();
    }
}

//# sourceMappingURL=AuroraPostgresDriver.js.map
