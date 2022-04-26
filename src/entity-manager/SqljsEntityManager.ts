import { DataSource } from "../data-source/DataSource"
import { QueryRunner } from "../query-runner/QueryRunner"
import { EntityManager } from "./EntityManager"
import { SqljsDriver } from "../driver/sqljs/SqljsDriver"

/**
 * A special EntityManager that includes import/export and load/save function
 * that are unique to Sql.js.
 */
export class SqljsEntityManager extends EntityManager {
    readonly "@instanceof" = Symbol.for("SqljsEntityManager")

    private driver: SqljsDriver

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: DataSource, queryRunner?: QueryRunner) {
        super(connection, queryRunner)
        this.driver = connection.driver as SqljsDriver
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Loads either the definition from a file (Node.js) or localstorage (browser)
     * or uses the given definition to open a new database.
     */
    async loadDatabase(
        fileNameOrLocalStorageOrData: string | Uint8Array,
    ): Promise<void> {
        await this.driver.load(fileNameOrLocalStorageOrData)
    }

    /**
     * Saves the current database to a file (Node.js) or localstorage (browser)
     * if fileNameOrLocalStorage is not set options.location is used.
     */
    async saveDatabase(fileNameOrLocalStorage?: string): Promise<void> {
        await this.driver.save(fileNameOrLocalStorage)
    }

    /**
     * Returns the current database definition.
     */
    exportDatabase(): Uint8Array {
        return this.driver.export()
    }
}
