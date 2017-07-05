import {importClassesFromDirectories, importJsonsFromDirectories} from "../util/DirectoryExportedClassesLoader";
import {OrmUtils} from "../util/OrmUtils";
import {getFromContainer} from "../container";
import {MigrationInterface} from "../migration/MigrationInterface";
import {getMetadataArgsStorage} from "../index";
import {EntityMetadataBuilder} from "../metadata-builder/EntityMetadataBuilder";
import {EntitySchemaTransformer} from "../entity-schema/EntitySchemaTransformer";
import {Connection} from "./Connection";
import {EntitySchema} from "../entity-schema/EntitySchema";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {EntitySubscriberInterface} from "../subscriber/EntitySubscriberInterface";

/**
 * Builds migration instances, subscriber instances and entity metadatas for the given classes.
 */
export class ConnectionMetadataBuilder {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Builds migration instances for the given classes or directories.
     */
    buildMigrations(migrations: Function[]|string[]): MigrationInterface[] {
        const [migrationClasses, migrationDirectories] = OrmUtils.splitClassesAndStrings(migrations);
        const allMigrationClasses = [...migrationClasses, ...importClassesFromDirectories(migrationDirectories)];
        return allMigrationClasses.map(migrationClass => getFromContainer<MigrationInterface>(migrationClass));
    }

    /**
     * Builds subscriber instances for the given classes or directories.
     */
    buildSubscribers(subscribers: Function[]|string[]): EntitySubscriberInterface<any>[] {
        const [subscriberClasses, subscriberDirectories] = OrmUtils.splitClassesAndStrings(subscribers || []);
        const allSubscriberClasses = [...subscriberClasses, ...importClassesFromDirectories(subscriberDirectories)];
        return getMetadataArgsStorage()
            .filterSubscribers(allSubscriberClasses)
            .map(metadata => getFromContainer<EntitySubscriberInterface<any>>(metadata.target));
    }

    /**
     * Builds entity metadatas for the given classes or directories.
     */
    buildEntityMetadatas(entities: Function[]|string[], schemas: EntitySchema[]|string[]): EntityMetadata[] {
        const [entityClasses, entityDirectories] = OrmUtils.splitClassesAndStrings(entities || []);
        const allEntityClasses = [...entityClasses, ...importClassesFromDirectories(entityDirectories)];
        const decoratorEntityMetadatas = new EntityMetadataBuilder(this.connection, getMetadataArgsStorage()).build(allEntityClasses);

        const [entitySchemaClasses, entitySchemaDirectories] = OrmUtils.splitClassesAndStrings(schemas || []);
        const allEntitySchemaClasses = [...entitySchemaClasses, ...importJsonsFromDirectories(entitySchemaDirectories)];
        const metadataArgsStorageFromSchema = new EntitySchemaTransformer().transform(allEntitySchemaClasses);
        const schemaEntityMetadatas = new EntityMetadataBuilder(this.connection, metadataArgsStorageFromSchema).build();

        return [...decoratorEntityMetadatas, ...schemaEntityMetadatas];
    }

}