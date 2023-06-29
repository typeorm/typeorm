/**
 * Thrown when required driver's package is not installed.
 */
export class DriverPackageNotInstalledError extends Error {
    constructor(driverName, packageName) {
        super();
        this.name = "DriverPackageNotInstalledError";
        Object.setPrototypeOf(this, DriverPackageNotInstalledError.prototype);
        this.message = `${driverName} package has not been found installed. Try to install it: npm install ${packageName} --save`;
    }
}

//# sourceMappingURL=DriverPackageNotInstalledError.js.map
