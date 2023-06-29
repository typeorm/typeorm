"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverPackageNotInstalledError = void 0;
/**
 * Thrown when required driver's package is not installed.
 */
class DriverPackageNotInstalledError extends Error {
    constructor(driverName, packageName) {
        super();
        this.name = "DriverPackageNotInstalledError";
        Object.setPrototypeOf(this, DriverPackageNotInstalledError.prototype);
        this.message = `${driverName} package has not been found installed. Try to install it: npm install ${packageName} --save`;
    }
}
exports.DriverPackageNotInstalledError = DriverPackageNotInstalledError;

//# sourceMappingURL=DriverPackageNotInstalledError.js.map
