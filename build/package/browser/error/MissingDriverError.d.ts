/**
 * Thrown when consumer specifies driver type that does not exist or supported.
 */
export declare class MissingDriverError extends Error {
    name: string;
    constructor(driverType: string);
}
