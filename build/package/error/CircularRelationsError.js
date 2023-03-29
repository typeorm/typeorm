"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircularRelationsError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when circular relations detected with nullable set to false.
 */
var CircularRelationsError = /** @class */ (function (_super) {
    tslib_1.__extends(CircularRelationsError, _super);
    function CircularRelationsError(path) {
        var _this = _super.call(this) || this;
        _this.name = "CircularRelationsError";
        Object.setPrototypeOf(_this, CircularRelationsError.prototype);
        _this.message = "Circular relations detected: " + path + ". To resolve this issue you need to set nullable: true somewhere in this dependency structure.";
        return _this;
    }
    return CircularRelationsError;
}(Error));
exports.CircularRelationsError = CircularRelationsError;

//# sourceMappingURL=CircularRelationsError.js.map
