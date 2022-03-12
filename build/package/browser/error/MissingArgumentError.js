import { __extends } from "tslib";
/**
 * Thrown when null or undefined are passed into find or update
*/
var MissingArgumentError = /** @class */ (function (_super) {
    __extends(MissingArgumentError, _super);
    function MissingArgumentError() {
        var _this = _super.call(this) || this;
        Object.setPrototypeOf(_this, MissingArgumentError.prototype);
        _this.message = "You are passing null or undefined into a function that requires one";
        return _this;
    }
    return MissingArgumentError;
}(Error));
export { MissingArgumentError };

//# sourceMappingURL=MissingArgumentError.js.map
