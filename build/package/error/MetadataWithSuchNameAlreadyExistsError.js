"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataWithSuchNameAlreadyExistsError = void 0;
var tslib_1 = require("tslib");
/**
 */
var MetadataWithSuchNameAlreadyExistsError = /** @class */ (function (_super) {
    tslib_1.__extends(MetadataWithSuchNameAlreadyExistsError, _super);
    function MetadataWithSuchNameAlreadyExistsError(metadataType, name) {
        var _this = _super.call(this) || this;
        _this.name = "MetadataWithSuchNameAlreadyExistsError";
        Object.setPrototypeOf(_this, MetadataWithSuchNameAlreadyExistsError.prototype);
        _this.message = metadataType + " metadata with such name " + name + " already exists. " +
            "Do you apply decorator twice? Or maybe try to change a name?";
        return _this;
    }
    return MetadataWithSuchNameAlreadyExistsError;
}(Error));
exports.MetadataWithSuchNameAlreadyExistsError = MetadataWithSuchNameAlreadyExistsError;

//# sourceMappingURL=MetadataWithSuchNameAlreadyExistsError.js.map
