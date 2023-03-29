"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityColumnNotFound = void 0;
var tslib_1 = require("tslib");
/**
 *
 */
var EntityColumnNotFound = /** @class */ (function (_super) {
    tslib_1.__extends(EntityColumnNotFound, _super);
    function EntityColumnNotFound(propertyPath) {
        var _this = _super.call(this) || this;
        _this.name = "EntityColumnNotFound";
        Object.setPrototypeOf(_this, EntityColumnNotFound.prototype);
        _this.message = "No entity column \"" + propertyPath + "\" was found.";
        return _this;
    }
    return EntityColumnNotFound;
}(Error));
exports.EntityColumnNotFound = EntityColumnNotFound;

//# sourceMappingURL=EntityColumnNotFound.js.map
