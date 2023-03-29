import { __extends } from "tslib";
/**
 */
var MissingJoinColumnError = /** @class */ (function (_super) {
    __extends(MissingJoinColumnError, _super);
    function MissingJoinColumnError(entityMetadata, relation) {
        var _this = _super.call(this) || this;
        _this.name = "MissingJoinColumnError";
        Object.setPrototypeOf(_this, MissingJoinColumnError.prototype);
        if (relation.inverseRelation) {
            _this.message = "JoinColumn is missing on both sides of " + entityMetadata.name + "#" + relation.propertyName + " and " +
                (relation.inverseEntityMetadata.name + "#" + relation.inverseRelation.propertyName + " one-to-one relationship. ") +
                "You need to put JoinColumn decorator on one of the sides.";
        }
        else {
            _this.message = "JoinColumn is missing on " + entityMetadata.name + "#" + relation.propertyName + " one-to-one relationship. " +
                "You need to put JoinColumn decorator on it.";
        }
        return _this;
    }
    return MissingJoinColumnError;
}(Error));
export { MissingJoinColumnError };

//# sourceMappingURL=MissingJoinColumnError.js.map
