import { __extends } from "tslib";
/**
 * Thrown when relations specified in the find options were not found in the entities.
*/
var FindRelationsNotFoundError = /** @class */ (function (_super) {
    __extends(FindRelationsNotFoundError, _super);
    function FindRelationsNotFoundError(notFoundRelations) {
        var _this = _super.call(this) || this;
        Object.setPrototypeOf(_this, FindRelationsNotFoundError.prototype);
        if (notFoundRelations.length === 1) {
            _this.message = "Relation \"" + notFoundRelations[0] + "\" was not found; please check if it is correct and really exists in your entity.";
        }
        else {
            _this.message = "Relations " + notFoundRelations.map(function (relation) { return "\"" + relation + "\""; }).join(", ") + " were not found; please check if relations are correct and they exist in your entities.";
        }
        return _this;
    }
    return FindRelationsNotFoundError;
}(Error));
export { FindRelationsNotFoundError };

//# sourceMappingURL=FindRelationsNotFoundError.js.map
