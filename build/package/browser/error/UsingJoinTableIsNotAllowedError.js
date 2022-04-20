import { __extends } from "tslib";
/**
 */
var UsingJoinTableIsNotAllowedError = /** @class */ (function (_super) {
    __extends(UsingJoinTableIsNotAllowedError, _super);
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
export { UsingJoinTableIsNotAllowedError };

//# sourceMappingURL=UsingJoinTableIsNotAllowedError.js.map
