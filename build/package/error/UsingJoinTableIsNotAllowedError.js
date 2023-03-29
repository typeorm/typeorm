"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsingJoinTableIsNotAllowedError = void 0;
var tslib_1 = require("tslib");
/**
 */
var UsingJoinTableIsNotAllowedError = /** @class */ (function (_super) {
    tslib_1.__extends(UsingJoinTableIsNotAllowedError, _super);
    function UsingJoinTableIsNotAllowedError(entityMetadata, relation) {
        var _this = _super.call(this) || this;
        _this.name = "UsingJoinTableIsNotAllowedError";
        Object.setPrototypeOf(_this, UsingJoinTableIsNotAllowedError.prototype);
        _this.message = "Using JoinTable on " + entityMetadata.name + "#" + relation.propertyName + " is wrong. " +
            (entityMetadata.name + "#" + relation.propertyName + " has " + relation.relationType + " relation, ") +
            "however you can use JoinTable only on many-to-many relations.";
        return _this;
    }
    return UsingJoinTableIsNotAllowedError;
}(Error));
exports.UsingJoinTableIsNotAllowedError = UsingJoinTableIsNotAllowedError;

//# sourceMappingURL=UsingJoinTableIsNotAllowedError.js.map
