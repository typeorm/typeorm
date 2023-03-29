import { __extends } from "tslib";
/**
 */
var UsingJoinColumnIsNotAllowedError = /** @class */ (function (_super) {
    __extends(UsingJoinColumnIsNotAllowedError, _super);
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
export { UsingJoinColumnIsNotAllowedError };

//# sourceMappingURL=UsingJoinColumnIsNotAllowedError.js.map
