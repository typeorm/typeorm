import { __awaiter, __extends, __generator } from "tslib";
import { EntityManager } from "./EntityManager";
/**
 * A special EntityManager that includes import/export and load/save function
 * that are unique to Sql.js.
 */
var SqljsEntityManager = /** @class */ (function (_super) {
    __extends(SqljsEntityManager, _super);
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function SqljsEntityManager(connection, queryRunner) {
        var _this = _super.call(this, connection, queryRunner) || this;
        _this.driver = connection.driver;
        return _this;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Loads either the definition from a file (Node.js) or localstorage (browser)
     * or uses the given definition to open a new database.
     */
    SqljsEntityManager.prototype.loadDatabase = function (fileNameOrLocalStorageOrData) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.driver.load(fileNameOrLocalStorageOrData)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Saves the current database to a file (Node.js) or localstorage (browser)
     * if fileNameOrLocalStorage is not set options.location is used.
     */
    SqljsEntityManager.prototype.saveDatabase = function (fileNameOrLocalStorage) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.driver.save(fileNameOrLocalStorage)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Returns the current database definition.
     */
    SqljsEntityManager.prototype.exportDatabase = function () {
        return this.driver.export();
    };
    return SqljsEntityManager;
}(EntityManager));
export { SqljsEntityManager };

//# sourceMappingURL=SqljsEntityManager.js.map
