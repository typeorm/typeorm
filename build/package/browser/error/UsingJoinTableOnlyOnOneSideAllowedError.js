import { __extends } from "tslib";
/**
 */
var UsingJoinTableOnlyOnOneSideAllowedError = /** @class */ (function (_super) {
    __extends(UsingJoinTableOnlyOnOneSideAllowedError, _super);
    function UsingJoinTableOnlyOnOneSideAllowedError(entityMetadata, relation) {
        var _this = _super.call(this) || this;
        _this.name = "UsingJoinTableOnlyOnOneSideAllowedError";
        Object.setPrototypeOf(_this, UsingJoinTableOnlyOnOneSideAllowedError.prototype);
        _this.message = "Using JoinTable is allowed only on one side of the many-to-many relationship. " +
            ("Both " + entityMetadata.name + "#" + relation.propertyName + " and " + relation.inverseEntityMetadata.name + "#" + relation.inverseRelation.propertyName + " ") +
            "has JoinTable decorators. Choose one of them and left JoinColumn decorator only on it.";
        return _this;
    }
    return UsingJoinTableOnlyOnOneSideAllowedError;
}(Error));
export { UsingJoinTableOnlyOnOneSideAllowedError };

//# sourceMappingURL=UsingJoinTableOnlyOnOneSideAllowedError.js.map
