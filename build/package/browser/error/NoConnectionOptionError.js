import { __extends } from "tslib";
/**
 * Thrown when some option is not set in the connection options.
 */
var NoConnectionOptionError = /** @class */ (function (_super) {
    __extends(NoConnectionOptionError, _super);
    function NoConnectionOptionError(optionName) {
        var _this = _super.call(this) || this;
        Object.setPrototypeOf(_this, NoConnectionOptionError.prototype);
        _this.message = "Option \"" + optionName + "\" is not set in your connection options, please define \"" + optionName + "\" option in your connection options or ormconfig.json";
        return _this;
    }
    return NoConnectionOptionError;
}(Error));
export { NoConnectionOptionError };

//# sourceMappingURL=NoConnectionOptionError.js.map
