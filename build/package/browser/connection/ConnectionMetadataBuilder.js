import { __read, __spreadArray } from "tslib";
import { importClassesFromDirectories } from "../util/DirectoryExportedClassesLoader";
import { OrmUtils } from "../util/OrmUtils";
import { getFromContainer } from "../container";
import { getMetadataArgsStorage } from "../index";
import { EntityMetadataBuilder } from "../metadata-builder/EntityMetadataBuilder";
import { EntitySchemaTransformer } from "../entity-schema/EntitySchemaTransformer";
import { EntitySchema } from "../entity-schema/EntitySchema";
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
        var _a = __read(OrmUtils.splitClassesAndStrings(migrations), 2), migrationClasses = _a[0], migrationDirectories = _a[1];
        var allMigrationClasses = __spreadArray(__spreadArray([], __read(migrationClasses)), __read(importClassesFromDirectories(this.connection.logger, migrationDirectories)));
        return allMigrationClasses.map(function (migrationClass) { return getFromContainer(migrationClass); });
    };
    /**
     * Builds subscriber instances for the given classes or directories.
     */
    ConnectionMetadataBuilder.prototype.buildSubscribers = function (subscribers) {
        var _a = __read(OrmUtils.splitClassesAndStrings(subscribers || []), 2), subscriberClasses = _a[0], subscriberDirectories = _a[1];
        var allSubscriberClasses = __spreadArray(__spreadArray([], __read(subscriberClasses)), __read(importClassesFromDirectories(this.connection.logger, subscriberDirectories)));
        return getMetadataArgsStorage()
            .filterSubscribers(allSubscriberClasses)
            .map(function (metadata) { return getFromContainer(metadata.target); });
    };
    /**
     * Builds entity metadatas for the given classes or directories.
     */
    ConnectionMetadataBuilder.prototype.buildEntityMetadatas = function (entities) {
        // todo: instead we need to merge multiple metadata args storages
        var _a = __read(OrmUtils.splitClassesAndStrings(entities || []), 2), entityClassesOrSchemas = _a[0], entityDirectories = _a[1];
        var entityClasses = entityClassesOrSchemas.filter(function (entityClass) { return (entityClass instanceof EntitySchema) === false; });
        var entitySchemas = entityClassesOrSchemas.filter(function (entityClass) { return entityClass instanceof EntitySchema; });
        var allEntityClasses = __spreadArray(__spreadArray([], __read(entityClasses)), __read(importClassesFromDirectories(this.connection.logger, entityDirectories)));
        allEntityClasses.forEach(function (entityClass) {
            if (entityClass instanceof EntitySchema) {
                entitySchemas.push(entityClass);
                allEntityClasses.slice(allEntityClasses.indexOf(entityClass), 1);
            }
        });
        var decoratorEntityMetadatas = new EntityMetadataBuilder(this.connection, getMetadataArgsStorage()).build(allEntityClasses);
        var metadataArgsStorageFromSchema = new EntitySchemaTransformer().transform(entitySchemas);
        var schemaEntityMetadatas = new EntityMetadataBuilder(this.connection, metadataArgsStorageFromSchema).build();
        return __spreadArray(__spreadArray([], __read(decoratorEntityMetadatas)), __read(schemaEntityMetadatas));
    };
    return ConnectionMetadataBuilder;
}());
export { ConnectionMetadataBuilder };

//# sourceMappingURL=ConnectionMetadataBuilder.js.map
