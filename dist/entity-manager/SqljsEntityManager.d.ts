import { Connection } from "../connection/Connection";
import { QueryRunner } from "../query-runner/QueryRunner";
import { EntityManager } from "./EntityManager";
/**
 * A special EntityManager that includes import/export and load/save function
 * that are unique to Sql.js.
 */
export declare class SqljsEntityManager extends EntityManager {
    private driver;
    constructor(connection: Connection, queryRunner?: QueryRunner);
    /**
     * Loads either the definition from a file (Node.js) or localstorage (browser)
     * or uses the given definition to open a new database.
     */
    loadDatabase(fileNameOrLocalStorageOrData: string | Uint8Array): Promise<void>;
    /**
     * Saves the current database to a file (Node.js) or localstorage (browser)
     * if fileNameOrLocalStorage is not set options.location is used.
     */
    saveDatabase(fileNameOrLocalStorage?: string): Promise<void>;
    /**
     * Returns the current database definition.
     */
    exportDatabase(): Uint8Array;
}
