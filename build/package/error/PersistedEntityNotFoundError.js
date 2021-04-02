"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistedEntityNotFoundError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown . Theoretically can't be thrown.
 */
var PersistedEntityNotFoundError = /** @class */ (function (_super) {
    tslib_1.__extends(PersistedEntityNotFoundError, _super);
    function PersistedEntityNotFoundError() {
        var _this = _super.call(this) || this;
        _this.name = "PersistedEntityNotFoundError";
        Object.setPrototypeOf(_this, PersistedEntityNotFoundError.prototype);
        _this.message = "Internal error. Persisted entity was not found in the list of prepared operated entities.";
        return _this;
    }
    return PersistedEntityNotFoundError;
}(Error));
exports.PersistedEntityNotFoundError = PersistedEntityNotFoundError;

//# sourceMappingURL=PersistedEntityNotFoundError.js.map
