"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CannotAttachTreeChildrenEntityError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when user saves tree children entity but its parent is not saved yet.
*/
var CannotAttachTreeChildrenEntityError = /** @class */ (function (_super) {
    tslib_1.__extends(CannotAttachTreeChildrenEntityError, _super);
    function CannotAttachTreeChildrenEntityError(entityName) {
        var _this = _super.call(this) || this;
        _this.name = "CannotAttachTreeChildrenEntityError";
        Object.setPrototypeOf(_this, CannotAttachTreeChildrenEntityError.prototype);
        _this.message = "Cannot attach entity \"" + entityName + "\" to its parent. Please make sure parent is saved in the database before saving children nodes.";
        return _this;
    }
    return CannotAttachTreeChildrenEntityError;
}(Error));
exports.CannotAttachTreeChildrenEntityError = CannotAttachTreeChildrenEntityError;

//# sourceMappingURL=CannotAttachTreeChildrenEntityError.js.map
