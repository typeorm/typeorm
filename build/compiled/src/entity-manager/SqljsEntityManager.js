"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqljsEntityManager = void 0;
const tslib_1 = require("tslib");
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
        this.driver = connection.driver;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Loads either the definition from a file (Node.js) or localstorage (browser)
     * or uses the given definition to open a new database.
     */
    loadDatabase(fileNameOrLocalStorageOrData) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.driver.load(fileNameOrLocalStorageOrData);
        });
    }
    /**
     * Saves the current database to a file (Node.js) or localstorage (browser)
     * if fileNameOrLocalStorage is not set options.location is used.
     */
    saveDatabase(fileNameOrLocalStorage) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.driver.save(fileNameOrLocalStorage);
        });
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