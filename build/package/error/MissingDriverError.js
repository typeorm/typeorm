"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingDriverError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when consumer specifies driver type that does not exist or supported.
 */
var MissingDriverError = /** @class */ (function (_super) {
    tslib_1.__extends(MissingDriverError, _super);
    function MissingDriverError(driverType) {
        var _this = _super.call(this) || this;
        _this.name = "MissingDriverError";
        Object.setPrototypeOf(_this, MissingDriverError.prototype);
        _this.message = "Wrong driver: \"" + driverType + "\" given. Supported drivers are: \"cordova\", \"expo\", \"mariadb\", \"mongodb\", \"mssql\", \"mysql\", \"oracle\", \"postgres\", \"sqlite\", \"better-sqlite3\", \"sqljs\", \"react-native\", \"aurora-data-api\", \"aurora-data-api-pg\".";
        return _this;
    }
    return MissingDriverError;
}(Error));
exports.MissingDriverError = MissingDriverError;

//# sourceMappingURL=MissingDriverError.js.map
