"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverPackageNotInstalledError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when required driver's package is not installed.
 */
var DriverPackageNotInstalledError = /** @class */ (function (_super) {
    tslib_1.__extends(DriverPackageNotInstalledError, _super);
    function DriverPackageNotInstalledError(driverName, packageName) {
        var _this = _super.call(this) || this;
        _this.name = "DriverPackageNotInstalledError";
        Object.setPrototypeOf(_this, DriverPackageNotInstalledError.prototype);
        _this.message = driverName + " package has not been found installed. Try to install it: npm install " + packageName + " --save";
        return _this;
    }
    return DriverPackageNotInstalledError;
}(Error));
exports.DriverPackageNotInstalledError = DriverPackageNotInstalledError;

//# sourceMappingURL=DriverPackageNotInstalledError.js.map
