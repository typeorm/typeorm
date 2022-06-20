"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqljsEntityManager = void 0;
const EntityManager_1 = require("./EntityManager");
/**
 * A special EntityManager that includes import/export and load/save function
 * that are unique to Sql.js.
 */
class SqljsEntityManager extends EntityManager_1.EntityManager {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection, queryRunner) {
        super(connection, queryRunner);
        this["@instanceof"] = Symbol.for("SqljsEntityManager");
        this.driver = connection.driver;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Loads either the definition from a file (Node.js) or localstorage (browser)
     * or uses the given definition to open a new database.
     */
    async loadDatabase(fileNameOrLocalStorageOrData) {
        await this.driver.load(fileNameOrLocalStorageOrData);
    }
    /**
     * Saves the current database to a file (Node.js) or localstorage (browser)
     * if fileNameOrLocalStorage is not set options.location is used.
     */
    async saveDatabase(fileNameOrLocalStorage) {
        await this.driver.save(fileNameOrLocalStorage);
    }
    /**
     * Returns the current database definition.
     */
    exportDatabase() {
        return this.driver.export();
    }
}
exports.SqljsEntityManager = SqljsEntityManager;

//# sourceMappingURL=SqljsEntityManager.js.map
