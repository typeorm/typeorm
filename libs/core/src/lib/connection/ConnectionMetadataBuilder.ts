import { importClassesFromDirectories } from "../util/DirectoryExportedClassesLoader";
import {
    ConnectionMetadataBuilder as BrowserConnectionMetadataBuilder,
    EntityMetadata,
    EntitySchema,
    EntitySubscriberInterface,
    MigrationInterface,
    OrmUtils
} from "@typeorm/browser-core";
import { Connection } from "./Connection";

/**
 * Builds migration instances, subscriber instances and entity metadatas for the given classes.
 */
export class ConnectionMetadataBuilder extends BrowserConnectionMetadataBuilder {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        super(connection);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Builds migration instances for the given classes or directories.
     */
    buildMigrations(migrations: (Function | string)[]): MigrationInterface[] {
        const [migrationClasses, migrationDirectories] = OrmUtils.splitClassesAndStrings(migrations);
        const allMigrationClasses = [...migrationClasses, ...importClassesFromDirectories(this.connection.logger, migrationDirectories)];
        return super.buildMigrations(allMigrationClasses);
    }

    /**
     * Builds subscriber instances for the given classes or directories.
     */
    buildSubscribers(subscribers: (Function | string)[]): EntitySubscriberInterface<any>[] {
        const [subscriberClasses, subscriberDirectories] = OrmUtils.splitClassesAndStrings(subscribers || []);
        const allSubscriberClasses = [...subscriberClasses, ...importClassesFromDirectories(this.connection.logger, subscriberDirectories)];
        return super.buildSubscribers(allSubscriberClasses);
    }

    /**
     * Builds entity metadatas for the given classes or directories.
     */
    buildEntityMetadatas(entities: (Function | EntitySchema<any> | string)[]): EntityMetadata[] {
        // todo: instead we need to merge multiple metadata args storages

        const [entityClassesOrSchemas, entityDirectories] = OrmUtils.splitClassesAndStrings(entities || []);

        const allEntityClasses = [...entityClassesOrSchemas, ...importClassesFromDirectories(this.connection.logger, entityDirectories)];
        return super.buildEntityMetadatas(allEntityClasses)
    }

}
