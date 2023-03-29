import { __extends } from "tslib";
var DataTypeNotSupportedError = /** @class */ (function (_super) {
    __extends(DataTypeNotSupportedError, _super);
    function DataTypeNotSupportedError(column, dataType, database) {
        var _this = _super.call(this) || this;
        _this.name = "DataTypeNotSupportedError";
        Object.setPrototypeOf(_this, DataTypeNotSupportedError.prototype);
        var type = typeof dataType === "string" ? dataType : dataType.name;
        _this.message = "Data type \"" + type + "\" in \"" + column.entityMetadata.targetName + "." + column.propertyName + "\" is not supported by \"" + database + "\" database.";
        return _this;
    }
    return DataTypeNotSupportedError;
}(Error));
export { DataTypeNotSupportedError };

//# sourceMappingURL=DataTypeNotSupportedError.js.map
