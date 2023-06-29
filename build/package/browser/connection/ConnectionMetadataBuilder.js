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
    buildMigrations(migrations) {
        const [migrationClasses, migrationDirectories] = OrmUtils.splitClassesAndStrings(migrations);
        const allMigrationClasses = [...migrationClasses, ...importClassesFromDirectories(this.connection.logger, migrationDirectories)];
        return allMigrationClasses.map(migrationClass => getFromContainer(migrationClass));
    }
    /**
     * Builds subscriber instances for the given classes or directories.
     */
    buildSubscribers(subscribers) {
        const [subscriberClasses, subscriberDirectories] = OrmUtils.splitClassesAndStrings(subscribers || []);
        const allSubscriberClasses = [...subscriberClasses, ...importClassesFromDirectories(this.connection.logger, subscriberDirectories)];
        return getMetadataArgsStorage()
            .filterSubscribers(allSubscriberClasses)
            .map(metadata => getFromContainer(metadata.target));
    }
    /**
     * Builds entity metadatas for the given classes or directories.
     */
    buildEntityMetadatas(entities) {
        // todo: instead we need to merge multiple metadata args storages
        const [entityClassesOrSchemas, entityDirectories] = OrmUtils.splitClassesAndStrings(entities || []);
        const entityClasses = entityClassesOrSchemas.filter(entityClass => (entityClass instanceof EntitySchema) === false);
        const entitySchemas = entityClassesOrSchemas.filter(entityClass => entityClass instanceof EntitySchema);
        const allEntityClasses = [...entityClasses, ...importClassesFromDirectories(this.connection.logger, entityDirectories)];
        allEntityClasses.forEach(entityClass => {
            if (entityClass instanceof EntitySchema) {
                entitySchemas.push(entityClass);
                allEntityClasses.slice(allEntityClasses.indexOf(entityClass), 1);
            }
        });
        const decoratorEntityMetadatas = new EntityMetadataBuilder(this.connection, getMetadataArgsStorage()).build(allEntityClasses);
        const metadataArgsStorageFromSchema = new EntitySchemaTransformer().transform(entitySchemas);
        const schemaEntityMetadatas = new EntityMetadataBuilder(this.connection, metadataArgsStorageFromSchema).build();
        return [...decoratorEntityMetadatas, ...schemaEntityMetadatas];
    }
}

//# sourceMappingURL=ConnectionMetadataBuilder.js.map
