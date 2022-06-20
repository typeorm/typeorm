import { importClassesFromDirectories } from "../util/DirectoryExportedClassesLoader";
import { OrmUtils } from "../util/OrmUtils";
import { getFromContainer } from "../container";
import { getMetadataArgsStorage } from "../globals";
import { EntityMetadataBuilder } from "../metadata-builder/EntityMetadataBuilder";
import { EntitySchemaTransformer } from "../entity-schema/EntitySchemaTransformer";
import { InstanceChecker } from "../util/InstanceChecker";
/**
 * Builds migration instances, subscriber instances and entity metadatas for the given classes.
 */
export class ConnectionMetadataBuilder {
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
    async buildMigrations(migrations) {
        const [migrationClasses, migrationDirectories] = OrmUtils.splitClassesAndStrings(migrations);
        const allMigrationClasses = [
            ...migrationClasses,
            ...(await importClassesFromDirectories(this.connection.logger, migrationDirectories)),
        ];
        return allMigrationClasses.map((migrationClass) => getFromContainer(migrationClass));
    }
    /**
     * Builds subscriber instances for the given classes or directories.
     */
    async buildSubscribers(subscribers) {
        const [subscriberClasses, subscriberDirectories] = OrmUtils.splitClassesAndStrings(subscribers || []);
        const allSubscriberClasses = [
            ...subscriberClasses,
            ...(await importClassesFromDirectories(this.connection.logger, subscriberDirectories)),
        ];
        return getMetadataArgsStorage()
            .filterSubscribers(allSubscriberClasses)
            .map((metadata) => getFromContainer(metadata.target));
    }
    /**
     * Builds entity metadatas for the given classes or directories.
     */
    async buildEntityMetadatas(entities) {
        // todo: instead we need to merge multiple metadata args storages
        const [entityClassesOrSchemas, entityDirectories] = OrmUtils.splitClassesAndStrings(entities || []);
        const entityClasses = entityClassesOrSchemas.filter((entityClass) => !InstanceChecker.isEntitySchema(entityClass));
        const entitySchemas = entityClassesOrSchemas.filter((entityClass) => InstanceChecker.isEntitySchema(entityClass));
        const allEntityClasses = [
            ...entityClasses,
            ...(await importClassesFromDirectories(this.connection.logger, entityDirectories)),
        ];
        allEntityClasses.forEach((entityClass) => {
            // if we have entity schemas loaded from directories
            if (InstanceChecker.isEntitySchema(entityClass)) {
                entitySchemas.push(entityClass);
            }
        });
        const decoratorEntityMetadatas = new EntityMetadataBuilder(this.connection, getMetadataArgsStorage()).build(allEntityClasses);
        const metadataArgsStorageFromSchema = new EntitySchemaTransformer().transform(entitySchemas);
        const schemaEntityMetadatas = new EntityMetadataBuilder(this.connection, metadataArgsStorageFromSchema).build();
        return [...decoratorEntityMetadatas, ...schemaEntityMetadatas];
    }
}

//# sourceMappingURL=ConnectionMetadataBuilder.js.map
