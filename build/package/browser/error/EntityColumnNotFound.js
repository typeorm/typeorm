import { __extends } from "tslib";
/**
 *
 */
var EntityColumnNotFound = /** @class */ (function (_super) {
    __extends(EntityColumnNotFound, _super);
    function EntityColumnNotFound(propertyPath) {
        var _this = _super.call(this) || this;
        _this.name = "EntityColumnNotFound";
        Object.setPrototypeOf(_this, EntityColumnNotFound.prototype);
        _this.message = "No entity column \"" + propertyPath + "\" was found.";
        return _this;
    }
    return EntityColumnNotFound;
}(Error));
export { EntityColumnNotFound };

//# sourceMappingURL=EntityColumnNotFound.js.map
