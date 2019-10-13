/**
 * Thrown when required driver's package is not installed.
 */
export declare class DriverPackageNotInstalledError extends Error {
    name: string;
    constructor(driverName: string, packageName: string);
}
