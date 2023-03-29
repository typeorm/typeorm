import { __extends } from "tslib";
var TreeRepositoryNotSupportedError = /** @class */ (function (_super) {
    __extends(TreeRepositoryNotSupportedError, _super);
    function TreeRepositoryNotSupportedError(driver) {
        var _this = _super.call(this) || this;
        _this.name = "TreeRepositoryNotSupportedError";
        Object.setPrototypeOf(_this, TreeRepositoryNotSupportedError.prototype);
        _this.message = "Tree repositories are not supported in " + driver.options.type + " driver.";
        return _this;
    }
    return TreeRepositoryNotSupportedError;
}(Error));
export { TreeRepositoryNotSupportedError };

//# sourceMappingURL=TreeRepositoryNotSupportedError.js.map
