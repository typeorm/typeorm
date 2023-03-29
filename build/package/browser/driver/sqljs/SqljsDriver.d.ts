import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver";
import { SqljsConnectionOptions } from "./SqljsConnectionOptions";
import { QueryRunner } from "../../query-runner/QueryRunner";
import { Connection } from "../../connection/Connection";
import { EntityMetadata } from "../../metadata/EntityMetadata";
import { ReplicationMode } from "../types/ReplicationMode";
export declare class SqljsDriver extends AbstractSqliteDriver {
    options: SqljsConnectionOptions;
    constructor(connection: Connection);
    /**
     * Performs connection to the database.
     */
    connect(): Promise<void>;
    /**
     * Closes connection with database.
     */
    disconnect(): Promise<void>;
    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: ReplicationMode): QueryRunner;
    /**
     * Loads a database from a given file (Node.js), local storage key (browser) or array.
     * This will delete the current database!
     */
    load(fileNameOrLocalStorageOrData: string | Uint8Array, checkIfFileOrLocalStorageExists?: boolean): Promise<any>;
    /**
     * Saved the current database to the given file (Node.js), local storage key (browser) or
     * indexedDB key (browser with enabled useLocalForage option).
     * If no location path is given, the location path in the options (if specified) will be used.
     */
    save(location?: string): Promise<void>;
    /**
     * This gets called by the QueryRunner when a change to the database is made.
     * If a custom autoSaveCallback is specified, it get's called with the database as Uint8Array,
     * otherwise the save method is called which saves it to file (Node.js), local storage (browser)
     * or indexedDB (browser with enabled useLocalForage option).
     */
    autoSave(): Promise<void>;
    /**
     * Returns the current database as Uint8Array.
     */
    export(): Uint8Array;
    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     */
    createGeneratedMap(metadata: EntityMetadata, insertResult: any): any;
    /**
     * Creates connection with the database.
     * If the location option is set, the database is loaded first.
     */
    protected createDatabaseConnection(): Promise<any>;
    /**
     * Creates connection with an optional database.
     * If database is specified it is loaded, otherwise a new empty database is created.
     */
    protected createDatabaseConnectionWithImport(database?: Uint8Array): Promise<any>;
    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void;
}
