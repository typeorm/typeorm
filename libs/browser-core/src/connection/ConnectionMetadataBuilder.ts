import { OrmUtils } from "../util/OrmUtils";
import { getFromContainer } from "../container";
import { MigrationInterface } from "../migration/MigrationInterface";
import { getMetadataArgsStorage } from "../metadata-args/get-metadata-args-storage";
import { EntityMetadataBuilder } from "../metadata-builder/EntityMetadataBuilder";
import { EntitySchemaTransformer } from "../entity-schema/EntitySchemaTransformer";
import { Connection } from "./Connection";
import { EntitySchema } from "../entity-schema/EntitySchema";
import { EntityMetadata } from "../metadata/EntityMetadata";
import { EntitySubscriberInterface } from "../subscriber/EntitySubscriberInterface";

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
    buildMigrations(migrations: (Function | string)[]): MigrationInterface[] {
        const [migrationClasses] = OrmUtils.splitClassesAndStrings(migrations);
        const allMigrationClasses = [...migrationClasses];
        return allMigrationClasses.map(migrationClass => getFromContainer<MigrationInterface>(migrationClass));
    }

    /**
     * Builds subscriber instances for the given classes or directories.
     */
    buildSubscribers(subscribers: (Function | string)[]): EntitySubscriberInterface<any>[] {
        const [subscriberClasses] = OrmUtils.splitClassesAndStrings(subscribers || []);
        const allSubscriberClasses = [...subscriberClasses];
        return getMetadataArgsStorage()
            .filterSubscribers(allSubscriberClasses)
            .map(metadata => getFromContainer<EntitySubscriberInterface<any>>(metadata.target));
    }

    /**
     * Builds entity metadatas for the given classes or directories.
     */
    buildEntityMetadatas(entities: (Function | EntitySchema<any> | string)[]): EntityMetadata[] {
        // todo: instead we need to merge multiple metadata args storages

        const entityClasses: Function[] = entities.filter(entityClass => !(entityClass instanceof EntitySchema)) as any;
        const entitySchemas: EntitySchema<any>[] = entities.filter(entityClass => entityClass instanceof EntitySchema) as any;

        const allEntityClasses = [...entityClasses];
        allEntityClasses.forEach(entityClass => { // if we have entity schemas loaded from directories
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
