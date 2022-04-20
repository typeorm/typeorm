"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeRepositoryNotSupportedError = void 0;
var tslib_1 = require("tslib");
var TreeRepositoryNotSupportedError = /** @class */ (function (_super) {
    tslib_1.__extends(TreeRepositoryNotSupportedError, _super);
    function TreeRepositoryNotSupportedError(driver) {
        var _this = _super.call(this) || this;
        _this.name = "TreeRepositoryNotSupportedError";
        Object.setPrototypeOf(_this, TreeRepositoryNotSupportedError.prototype);
        _this.message = "Tree repositories are not supported in " + driver.options.type + " driver.";
        return _this;
    }
    return TreeRepositoryNotSupportedError;
}(Error));
exports.TreeRepositoryNotSupportedError = TreeRepositoryNotSupportedError;

//# sourceMappingURL=TreeRepositoryNotSupportedError.js.map
