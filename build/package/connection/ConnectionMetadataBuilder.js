"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionMetadataBuilder = void 0;
const DirectoryExportedClassesLoader_1 = require("../util/DirectoryExportedClassesLoader");
const OrmUtils_1 = require("../util/OrmUtils");
const container_1 = require("../container");
const index_1 = require("../index");
const EntityMetadataBuilder_1 = require("../metadata-builder/EntityMetadataBuilder");
const EntitySchemaTransformer_1 = require("../entity-schema/EntitySchemaTransformer");
const EntitySchema_1 = require("../entity-schema/EntitySchema");
/**
 * Builds migration instances, subscriber instances and entity metadatas for the given classes.
 */
class ConnectionMetadataBuilder {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection) {
        this.connection = connection;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Builds migration instances for the given classes or directories.
     */
    buildMigrations(migrations) {
        const [migrationClasses, migrationDirectories] = OrmUtils_1.OrmUtils.splitClassesAndStrings(migrations);
        const allMigrationClasses = [...migrationClasses, ...(0, DirectoryExportedClassesLoader_1.importClassesFromDirectories)(this.connection.logger, migrationDirectories)];
        return allMigrationClasses.map(migrationClass => (0, container_1.getFromContainer)(migrationClass));
    }
    /**
     * Builds subscriber instances for the given classes or directories.
     */
    buildSubscribers(subscribers) {
        const [subscriberClasses, subscriberDirectories] = OrmUtils_1.OrmUtils.splitClassesAndStrings(subscribers || []);
        const allSubscriberClasses = [...subscriberClasses, ...(0, DirectoryExportedClassesLoader_1.importClassesFromDirectories)(this.connection.logger, subscriberDirectories)];
        return (0, index_1.getMetadataArgsStorage)()
            .filterSubscribers(allSubscriberClasses)
            .map(metadata => (0, container_1.getFromContainer)(metadata.target));
    }
    /**
     * Builds entity metadatas for the given classes or directories.
     */
    buildEntityMetadatas(entities) {
        // todo: instead we need to merge multiple metadata args storages
        const [entityClassesOrSchemas, entityDirectories] = OrmUtils_1.OrmUtils.splitClassesAndStrings(entities || []);
        const entityClasses = entityClassesOrSchemas.filter(entityClass => (entityClass instanceof EntitySchema_1.EntitySchema) === false);
        const entitySchemas = entityClassesOrSchemas.filter(entityClass => entityClass instanceof EntitySchema_1.EntitySchema);
        const allEntityClasses = [...entityClasses, ...(0, DirectoryExportedClassesLoader_1.importClassesFromDirectories)(this.connection.logger, entityDirectories)];
        allEntityClasses.forEach(entityClass => {
            if (entityClass instanceof EntitySchema_1.EntitySchema) {
                entitySchemas.push(entityClass);
                allEntityClasses.slice(allEntityClasses.indexOf(entityClass), 1);
            }
        });
        const decoratorEntityMetadatas = new EntityMetadataBuilder_1.EntityMetadataBuilder(this.connection, (0, index_1.getMetadataArgsStorage)()).build(allEntityClasses);
        const metadataArgsStorageFromSchema = new EntitySchemaTransformer_1.EntitySchemaTransformer().transform(entitySchemas);
        const schemaEntityMetadatas = new EntityMetadataBuilder_1.EntityMetadataBuilder(this.connection, metadataArgsStorageFromSchema).build();
        return [...decoratorEntityMetadatas, ...schemaEntityMetadatas];
    }
}
exports.ConnectionMetadataBuilder = ConnectionMetadataBuilder;

//# sourceMappingURL=ConnectionMetadataBuilder.js.map
