"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuroraDataApiPostgresDriver = void 0;
var tslib_1 = require("tslib");
var PostgresDriver_1 = require("../postgres/PostgresDriver");
var PlatformTools_1 = require("../../platform/PlatformTools");
var AuroraDataApiPostgresQueryRunner_1 = require("../aurora-data-api-pg/AuroraDataApiPostgresQueryRunner");
var ApplyValueTransformers_1 = require("../../util/ApplyValueTransformers");
var PostgresWrapper = /** @class */ (function (_super) {
    tslib_1.__extends(PostgresWrapper, _super);
    function PostgresWrapper() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PostgresWrapper;
}(PostgresDriver_1.PostgresDriver));
var AuroraDataApiPostgresDriver = /** @class */ (function (_super) {
    tslib_1.__extends(AuroraDataApiPostgresDriver, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function AuroraDataApiPostgresDriver(connection) {
        var _this = _super.call(this) || this;
        _this.connection = connection;
        _this.options = connection.options;
        _this.isReplicated = false;
        // load data-api package
        _this.loadDependencies();
        _this.client = new _this.DataApiDriver(_this.options.region, _this.options.secretArn, _this.options.resourceArn, _this.options.database, function (query, parameters) { return _this.connection.logger.logQuery(query, parameters); }, _this.options.serviceConfigOptions, _this.options.formatOptions);
        return _this;
    }
    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------
    /**
     * Performs connection to the database.
     * Based on pooling options, it can either create connection immediately,
     * either create a pool and create connection when needed.
     */
    AuroraDataApiPostgresDriver.prototype.connect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * Closes connection with database.
     */
    AuroraDataApiPostgresDriver.prototype.disconnect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * Creates a query runner used to execute database queries.
     */
    AuroraDataApiPostgresDriver.prototype.createQueryRunner = function (mode) {
        var _this = this;
        return new AuroraDataApiPostgresQueryRunner_1.AuroraDataApiPostgresQueryRunner(this, new this.DataApiDriver(this.options.region, this.options.secretArn, this.options.resourceArn, this.options.database, function (query, parameters) { return _this.connection.logger.logQuery(query, parameters); }, this.options.serviceConfigOptions, this.options.formatOptions), mode);
    };
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    AuroraDataApiPostgresDriver.prototype.preparePersistentValue = function (value, columnMetadata) {
        if (this.options.formatOptions && this.options.formatOptions.castParameters === false) {
            return _super.prototype.preparePersistentValue.call(this, value, columnMetadata);
        }
        if (columnMetadata.transformer)
            value = ApplyValueTransformers_1.ApplyValueTransformers.transformTo(columnMetadata.transformer, value);
        return this.client.preparePersistentValue(value, columnMetadata);
    };
    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     */
    AuroraDataApiPostgresDriver.prototype.prepareHydratedValue = function (value, columnMetadata) {
        if (this.options.formatOptions && this.options.formatOptions.castParameters === false) {
            return _super.prototype.prepareHydratedValue.call(this, value, columnMetadata);
        }
        if (columnMetadata.transformer)
            value = ApplyValueTransformers_1.ApplyValueTransformers.transformFrom(columnMetadata.transformer, value);
        return this.client.prepareHydratedValue(value, columnMetadata);
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    AuroraDataApiPostgresDriver.prototype.loadDependencies = function () {
        var pg = PlatformTools_1.PlatformTools.load("typeorm-aurora-data-api-driver").pg;
        this.DataApiDriver = pg;
    };
    /**
     * Executes given query.
     */
    AuroraDataApiPostgresDriver.prototype.executeQuery = function (connection, query) {
        return this.connection.query(query);
    };
    /**
     * Makes any action after connection (e.g. create extensions in Postgres driver).
     */
    AuroraDataApiPostgresDriver.prototype.afterConnect = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var extensionsMetadata;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkMetadataForExtensions()];
                    case 1:
                        extensionsMetadata = _a.sent();
                        if (!extensionsMetadata.hasExtensions) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.enableExtensions(extensionsMetadata, this.connection)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, Promise.resolve()];
                }
            });
        });
    };
    return AuroraDataApiPostgresDriver;
}(PostgresWrapper));
exports.AuroraDataApiPostgresDriver = AuroraDataApiPostgresDriver;

//# sourceMappingURL=AuroraDataApiPostgresDriver.js.map
