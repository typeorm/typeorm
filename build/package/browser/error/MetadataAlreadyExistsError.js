import { __extends } from "tslib";
/**
 */
var MetadataAlreadyExistsError = /** @class */ (function (_super) {
    __extends(MetadataAlreadyExistsError, _super);
    function MetadataAlreadyExistsError(metadataType, constructor, propertyName) {
        var _this = _super.call(this) || this;
        _this.name = "MetadataAlreadyExistsError";
        Object.setPrototypeOf(_this, MetadataAlreadyExistsError.prototype);
        _this.message = metadataType + " metadata already exists for the class constructor " + JSON.stringify(constructor) +
            (propertyName ? " on property " + propertyName : ". If you previously renamed or moved entity class, make sure" +
                " that compiled version of old entity class source wasn't left in the compiler output directory.");
        return _this;
    }
    return MetadataAlreadyExistsError;
}(Error));
export { MetadataAlreadyExistsError };

//# sourceMappingURL=MetadataAlreadyExistsError.js.map
