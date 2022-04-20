"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoVersionOrUpdateDateColumnError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when an entity does not have no version and no update date column.
 */
var NoVersionOrUpdateDateColumnError = /** @class */ (function (_super) {
    tslib_1.__extends(NoVersionOrUpdateDateColumnError, _super);
    function NoVersionOrUpdateDateColumnError(entity) {
        var _this = _super.call(this) || this;
        _this.name = "NoVersionOrUpdateDateColumnError";
        Object.setPrototypeOf(_this, NoVersionOrUpdateDateColumnError.prototype);
        _this.message = "Entity " + entity + " does not have version or update date columns.";
        return _this;
    }
    return NoVersionOrUpdateDateColumnError;
}(Error));
exports.NoVersionOrUpdateDateColumnError = NoVersionOrUpdateDateColumnError;

//# sourceMappingURL=NoVersionOrUpdateDateColumnError.js.map
