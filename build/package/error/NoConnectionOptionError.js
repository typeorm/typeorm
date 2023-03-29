"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoConnectionOptionError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when some option is not set in the connection options.
 */
var NoConnectionOptionError = /** @class */ (function (_super) {
    tslib_1.__extends(NoConnectionOptionError, _super);
    function NoConnectionOptionError(optionName) {
        var _this = _super.call(this) || this;
        Object.setPrototypeOf(_this, NoConnectionOptionError.prototype);
        _this.message = "Option \"" + optionName + "\" is not set in your connection options, please define \"" + optionName + "\" option in your connection options or ormconfig.json";
        return _this;
    }
    return NoConnectionOptionError;
}(Error));
exports.NoConnectionOptionError = NoConnectionOptionError;

//# sourceMappingURL=NoConnectionOptionError.js.map
