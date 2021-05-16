/**
 * Thrown when required driver's package is not installed.
 */
export class DriverPackageNotInstalledError extends Error {
    name = "DriverPackageNotInstalledError";

    constructor(driverName: string, packageName: string) {
        super();
        Object.setPrototypeOf(this, DriverPackageNotInstalledError.prototype);
        this.message = `${driverName} package has not been found installed. Try to install it: npm install ${packageName} --save`;
    }

}