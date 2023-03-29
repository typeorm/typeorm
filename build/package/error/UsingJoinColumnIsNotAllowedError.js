"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsingJoinColumnIsNotAllowedError = void 0;
var tslib_1 = require("tslib");
/**
 */
var UsingJoinColumnIsNotAllowedError = /** @class */ (function (_super) {
    tslib_1.__extends(UsingJoinColumnIsNotAllowedError, _super);
    function UsingJoinColumnIsNotAllowedError(entityMetadata, relation) {
        var _this = _super.call(this) || this;
        _this.name = "UsingJoinColumnIsNotAllowedError";
        Object.setPrototypeOf(_this, UsingJoinColumnIsNotAllowedError.prototype);
        _this.message = "Using JoinColumn on " + entityMetadata.name + "#" + relation.propertyName + " is wrong. " +
            "You can use JoinColumn only on one-to-one and many-to-one relations.";
        return _this;
    }
    return UsingJoinColumnIsNotAllowedError;
}(Error));
exports.UsingJoinColumnIsNotAllowedError = UsingJoinColumnIsNotAllowedError;

//# sourceMappingURL=UsingJoinColumnIsNotAllowedError.js.map
