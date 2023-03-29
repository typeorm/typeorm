import { __extends } from "tslib";
import { EntitySchema } from "../index";
/**
 */
var EntityMetadataNotFoundError = /** @class */ (function (_super) {
    __extends(EntityMetadataNotFoundError, _super);
    function EntityMetadataNotFoundError(target) {
        var _this = _super.call(this) || this;
        _this.name = "EntityMetadataNotFound";
        Object.setPrototypeOf(_this, EntityMetadataNotFoundError.prototype);
        var targetName;
        if (target instanceof EntitySchema) {
            targetName = target.options.name;
        }
        else if (typeof target === "function") {
            targetName = target.name;
        }
        else if (typeof target === "object" && "name" in target) {
            targetName = target.name;
        }
        else {
            targetName = target;
        }
        _this.message = "No metadata for \"" + targetName + "\" was found.";
        return _this;
    }
    return EntityMetadataNotFoundError;
}(Error));
export { EntityMetadataNotFoundError };

//# sourceMappingURL=EntityMetadataNotFoundError.js.map
