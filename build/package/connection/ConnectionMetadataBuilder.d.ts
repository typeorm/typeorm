import { MigrationInterface } from "../migration/MigrationInterface";
import { Connection } from "./Connection";
import { EntitySchema } from "../entity-schema/EntitySchema";
import { EntityMetadata } from "../metadata/EntityMetadata";
import { EntitySubscriberInterface } from "../subscriber/EntitySubscriberInterface";
/**
 * Builds migration instances, subscriber instances and entity metadatas for the given classes.
 */
export declare class ConnectionMetadataBuilder {
    protected connection: Connection;
    constructor(connection: Connection);
    /**
     * Builds migration instances for the given classes or directories.
     */
    buildMigrations(migrations: (Function | string)[]): MigrationInterface[];
    /**
     * Builds subscriber instances for the given classes or directories.
     */
    buildSubscribers(subscribers: (Function | string)[]): EntitySubscriberInterface<any>[];
    /**
     * Builds entity metadatas for the given classes or directories.
     */
    buildEntityMetadatas(entities: (Function | EntitySchema<any> | string)[]): EntityMetadata[];
}
