import { __awaiter } from "tslib";
import { EntityManager } from "./EntityManager";
/**
 * A special EntityManager that includes import/export and load/save function
 * that are unique to Sql.js.
 */
export class SqljsEntityManager extends EntityManager {
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
        return __awaiter(this, void 0, void 0, function* () {
            yield this.driver.load(fileNameOrLocalStorageOrData);
        });
    }
    /**
     * Saves the current database to a file (Node.js) or localstorage (browser)
     * if fileNameOrLocalStorage is not set options.location is used.
     */
    saveDatabase(fileNameOrLocalStorage) {
        return __awaiter(this, void 0, void 0, function* () {
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

//# sourceMappingURL=SqljsEntityManager.js.map
