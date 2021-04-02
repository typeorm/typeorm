"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityMetadataNotFoundError = void 0;
var tslib_1 = require("tslib");
var index_1 = require("../index");
/**
 */
var EntityMetadataNotFoundError = /** @class */ (function (_super) {
    tslib_1.__extends(EntityMetadataNotFoundError, _super);
    function EntityMetadataNotFoundError(target) {
        var _this = _super.call(this) || this;
        _this.name = "EntityMetadataNotFound";
        Object.setPrototypeOf(_this, EntityMetadataNotFoundError.prototype);
        var targetName;
        if (target instanceof index_1.EntitySchema) {
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
exports.EntityMetadataNotFoundError = EntityMetadataNotFoundError;

//# sourceMappingURL=EntityMetadataNotFoundError.js.map
