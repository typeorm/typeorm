"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionMetadataBuilder = void 0;
var tslib_1 = require("tslib");
var DirectoryExportedClassesLoader_1 = require("../util/DirectoryExportedClassesLoader");
var OrmUtils_1 = require("../util/OrmUtils");
var container_1 = require("../container");
var index_1 = require("../index");
var EntityMetadataBuilder_1 = require("../metadata-builder/EntityMetadataBuilder");
var EntitySchemaTransformer_1 = require("../entity-schema/EntitySchemaTransformer");
var EntitySchema_1 = require("../entity-schema/EntitySchema");
/**
 * Builds migration instances, subscriber instances and entity metadatas for the given classes.
 */
var ConnectionMetadataBuilder = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function ConnectionMetadataBuilder(connection) {
        this.connection = connection;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Builds migration instances for the given classes or directories.
     */
    ConnectionMetadataBuilder.prototype.buildMigrations = function (migrations) {
        var _a = tslib_1.__read(OrmUtils_1.OrmUtils.splitClassesAndStrings(migrations), 2), migrationClasses = _a[0], migrationDirectories = _a[1];
        var allMigrationClasses = tslib_1.__spreadArray(tslib_1.__spreadArray([], tslib_1.__read(migrationClasses)), tslib_1.__read(DirectoryExportedClassesLoader_1.importClassesFromDirectories(this.connection.logger, migrationDirectories)));
        return allMigrationClasses.map(function (migrationClass) { return container_1.getFromContainer(migrationClass); });
    };
    /**
     * Builds subscriber instances for the given classes or directories.
     */
    ConnectionMetadataBuilder.prototype.buildSubscribers = function (subscribers) {
        var _a = tslib_1.__read(OrmUtils_1.OrmUtils.splitClassesAndStrings(subscribers || []), 2), subscriberClasses = _a[0], subscriberDirectories = _a[1];
        var allSubscriberClasses = tslib_1.__spreadArray(tslib_1.__spreadArray([], tslib_1.__read(subscriberClasses)), tslib_1.__read(DirectoryExportedClassesLoader_1.importClassesFromDirectories(this.connection.logger, subscriberDirectories)));
        return index_1.getMetadataArgsStorage()
            .filterSubscribers(allSubscriberClasses)
            .map(function (metadata) { return container_1.getFromContainer(metadata.target); });
    };
    /**
     * Builds entity metadatas for the given classes or directories.
     */
    ConnectionMetadataBuilder.prototype.buildEntityMetadatas = function (entities) {
        // todo: instead we need to merge multiple metadata args storages
        var _a = tslib_1.__read(OrmUtils_1.OrmUtils.splitClassesAndStrings(entities || []), 2), entityClassesOrSchemas = _a[0], entityDirectories = _a[1];
        var entityClasses = entityClassesOrSchemas.filter(function (entityClass) { return (entityClass instanceof EntitySchema_1.EntitySchema) === false; });
        var entitySchemas = entityClassesOrSchemas.filter(function (entityClass) { return entityClass instanceof EntitySchema_1.EntitySchema; });
        var allEntityClasses = tslib_1.__spreadArray(tslib_1.__spreadArray([], tslib_1.__read(entityClasses)), tslib_1.__read(DirectoryExportedClassesLoader_1.importClassesFromDirectories(this.connection.logger, entityDirectories)));
        allEntityClasses.forEach(function (entityClass) {
            if (entityClass instanceof EntitySchema_1.EntitySchema) {
                entitySchemas.push(entityClass);
                allEntityClasses.slice(allEntityClasses.indexOf(entityClass), 1);
            }
        });
        var decoratorEntityMetadatas = new EntityMetadataBuilder_1.EntityMetadataBuilder(this.connection, index_1.getMetadataArgsStorage()).build(allEntityClasses);
        var metadataArgsStorageFromSchema = new EntitySchemaTransformer_1.EntitySchemaTransformer().transform(entitySchemas);
        var schemaEntityMetadatas = new EntityMetadataBuilder_1.EntityMetadataBuilder(this.connection, metadataArgsStorageFromSchema).build();
        return tslib_1.__spreadArray(tslib_1.__spreadArray([], tslib_1.__read(decoratorEntityMetadatas)), tslib_1.__read(schemaEntityMetadatas));
    };
    return ConnectionMetadataBuilder;
}());
exports.ConnectionMetadataBuilder = ConnectionMetadataBuilder;

//# sourceMappingURL=ConnectionMetadataBuilder.js.map
