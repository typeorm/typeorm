import { AbstractSqliteDriver } from "@typeorm/driver-sqlite-abstract";
import { SqljsConnectionOptions } from "./SqljsConnectionOptions";
import { SqljsQueryRunner } from "./SqljsQueryRunner";
import {
    Connection,
    DriverOptionNotSetError,
    EntityMetadata,
    ObjectLiteral,
    OrmUtils,
    QueryRunner
} from "@typeorm/core";
import * as initSqlJs from 'sql.js';
import { SqljsEntityManager } from './SqljsEntityManager';
import { fileExistsSync } from 'tsconfig-paths/lib/filesystem';
import { readFileSync, writeFileSync } from 'fs';

export class SqljsDriver extends AbstractSqliteDriver {

    entityManagerCls = SqljsEntityManager;

    /** The driver specific options. */
    options: SqljsConnectionOptions;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        super(connection);

        // If autoSave is enabled by user, location or autoSaveCallback have to be set
        // because either autoSave saves to location or calls autoSaveCallback.
        if (this.options.autoSave && !this.options.location && !this.options.autoSaveCallback) {
            throw new DriverOptionNotSetError(`location or autoSaveCallback`);
        }
    }


    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Performs connection to the database.
     */
    async connect(): Promise<void> {
        this.databaseConnection = await this.createDatabaseConnection();
    }

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            try {
                this.queryRunner = undefined;
                this.databaseConnection.close();
                ok();
            } catch (e) {
                fail(e);
            }
        });
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: "master" | "slave" = "master"): QueryRunner {
        if (!this.queryRunner)
            this.queryRunner = new SqljsQueryRunner(this);

        return this.queryRunner;
    }

    /**
     * Loads a database from a given file.
     * This will delete the current database!
     */
    async load(fileNameOrLocalStorageOrData: string | Uint8Array, checkIfFileOrLocalStorageExists: boolean = true): Promise<any> {
        if (typeof fileNameOrLocalStorageOrData === "string") {
            // content has to be loaded
            // fileNameOrLocalStorageOrData should be a path to the file
            if (fileExistsSync(fileNameOrLocalStorageOrData)) {
                const database = readFileSync(fileNameOrLocalStorageOrData);
                return this.createDatabaseConnectionWithImport(database);
            } else if (checkIfFileOrLocalStorageExists) {
                throw new Error(`File ${fileNameOrLocalStorageOrData} does not exist`);
            } else {
                // File doesn't exist and checkIfFileOrLocalStorageExists is set to false.
                // Therefore open a database without importing an existing file.
                // File will be written on first write operation.
                return this.createDatabaseConnectionWithImport();
            }
        } else {
            return this.createDatabaseConnectionWithImport(fileNameOrLocalStorageOrData);
        }
    }

    /**
     * Saved the current database to the given file.
     * If no location path is given, the location path in the options (if specified) will be used.
     */
    async save(location?: string) {
        if (!location && !this.options.location) {
            throw new Error(`No location is set, specify a location parameter or add the location option to your configuration`);
        }

        let path = "";
        if (location) {
            path = location;
        } else if (this.options.location) {
            path = this.options.location;
        }

        try {
            const content = Buffer.from(this.databaseConnection.export());
            writeFileSync(path, content);
        } catch (e) {
            throw new Error(`Could not save database, error: ${e}`);
        }
    }

    /**
     * This gets called by the QueryRunner when a change to the database is made.
     * If a custom autoSaveCallback is specified, it get's called with the database as Uint8Array,
     * otherwise the save method is called which saves it to file.
     */
    async autoSave() {
        if (this.options.autoSave) {
            if (this.options.autoSaveCallback) {
                await this.options.autoSaveCallback(this.export());
            } else {
                await this.save();
            }
        }
    }

    /**
     * Returns the current database as Uint8Array.
     */
    export(): Uint8Array {
        return this.databaseConnection.export();
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(metadata: EntityMetadata, insertResult: any) {
        const generatedMap = metadata.generatedColumns.reduce((map, generatedColumn) => {
            // seems to be the only way to get the inserted id, see https://github.com/kripken/sql.js/issues/77
            if (generatedColumn.isPrimary && generatedColumn.generationStrategy === "increment") {
                const query = "SELECT last_insert_rowid()";
                try {
                    const result = this.databaseConnection.exec(query);
                    this.connection.logger.logQuery(query);
                    return OrmUtils.mergeDeep(map, generatedColumn.createValueMap(result[0].values[0][0]));
                } catch (e) {
                    this.connection.logger.logQueryError(e, query, []);
                }
            }

            return map;
        }, {} as ObjectLiteral);

        return Object.keys(generatedMap).length > 0 ? generatedMap : undefined;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     * If the location option is set, the database is loaded first.
     */
    protected createDatabaseConnection(): Promise<any> {
        if (this.options.location) {
            return this.load(this.options.location, false);
        }

        return this.createDatabaseConnectionWithImport(this.options.database);
    }

    /**
     * Creates connection with an optional database.
     * If database is specified it is loaded, otherwise a new empty database is created.
     */
    protected async createDatabaseConnectionWithImport(database?: Uint8Array): Promise<any> {
        const {Database} = await initSqlJs(this.options.sqlJsConfig);
        if (database && database.length > 0) {
            this.databaseConnection = new Database(database);
        } else {
            this.databaseConnection = new Database();
        }

        // Enable foreign keys for database
        return new Promise<any>((ok, fail) => {
            try {
                this.databaseConnection.exec(`PRAGMA foreign_keys = ON;`);
                ok(this.databaseConnection);
            } catch (e) {
                fail(e);
            }
        });
    }
}
