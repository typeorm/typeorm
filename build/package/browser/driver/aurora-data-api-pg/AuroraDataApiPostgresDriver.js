import { __awaiter } from "tslib";
import { PostgresDriver } from "../postgres/PostgresDriver";
import { PlatformTools } from "../../platform/PlatformTools";
import { AuroraDataApiPostgresQueryRunner } from "../aurora-data-api-pg/AuroraDataApiPostgresQueryRunner";
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers";
class PostgresWrapper extends PostgresDriver {
}
export class AuroraDataApiPostgresDriver extends PostgresWrapper {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        super();
        this.connection = connection;
        this.options = connection.options;
        this.isReplicated = false;
        // load data-api package
        this.loadDependencies();
        this.client = new this.DataApiDriver(this.options.region, this.options.secretArn, this.options.resourceArn, this.options.database, (query, parameters) => this.connection.logger.logQuery(query, parameters), this.options.serviceConfigOptions, this.options.formatOptions);
    }
    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------
    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
     * Closes connection with database.
     */
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode) {
        return new AuroraDataApiPostgresQueryRunner(this, new this.DataApiDriver(this.options.region, this.options.secretArn, this.options.resourceArn, this.options.database, (query, parameters) => this.connection.logger.logQuery(query, parameters), this.options.serviceConfigOptions, this.options.formatOptions), mode);
    }
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    preparePersistentValue(value, columnMetadata) {
        if (this.options.formatOptions && this.options.formatOptions.castParameters === false) {
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
        if (this.options.formatOptions && this.options.formatOptions.castParameters === false) {
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
        const { pg } = PlatformTools.load("typeorm-aurora-data-api-driver");
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
    afterConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            const extensionsMetadata = yield this.checkMetadataForExtensions();
            if (extensionsMetadata.hasExtensions) {
                yield this.enableExtensions(extensionsMetadata, this.connection);
            }
            return Promise.resolve();
        });
    }
}

//# sourceMappingURL=AuroraDataApiPostgresDriver.js.map
