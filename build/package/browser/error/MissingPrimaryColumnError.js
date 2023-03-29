import { __extends } from "tslib";
/**
 */
var MissingPrimaryColumnError = /** @class */ (function (_super) {
    __extends(MissingPrimaryColumnError, _super);
    function MissingPrimaryColumnError(entityMetadata) {
        var _this = _super.call(this) || this;
        _this.name = "MissingPrimaryColumnError";
        Object.setPrototypeOf(_this, MissingPrimaryColumnError.prototype);
        _this.message = "Entity \"" + entityMetadata.name + "\" does not have a primary column. Primary column is required to " +
            "have in all your entities. Use @PrimaryColumn decorator to add a primary column to your entity.";
        return _this;
    }
    return MissingPrimaryColumnError;
}(Error));
export { MissingPrimaryColumnError };

//# sourceMappingURL=MissingPrimaryColumnError.js.map
