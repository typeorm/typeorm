"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrimaryColumnCannotBeNullableError = void 0;
var tslib_1 = require("tslib");
var PrimaryColumnCannotBeNullableError = /** @class */ (function (_super) {
    tslib_1.__extends(PrimaryColumnCannotBeNullableError, _super);
    function PrimaryColumnCannotBeNullableError(object, propertyName) {
        var _this = _super.call(this) || this;
        _this.name = "PrimaryColumnCannotBeNullableError";
        Object.setPrototypeOf(_this, PrimaryColumnCannotBeNullableError.prototype);
        _this.message = "Primary column " + object.constructor.name + "#" + propertyName + " cannot be nullable. " +
            "Its not allowed for primary keys. Try to remove nullable option.";
        return _this;
    }
    return PrimaryColumnCannotBeNullableError;
}(Error));
exports.PrimaryColumnCannotBeNullableError = PrimaryColumnCannotBeNullableError;

//# sourceMappingURL=PrimaryColumnCannotBeNullableError.js.map
