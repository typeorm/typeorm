/**
 * Thrown if some required driver's option is not set.
 */
export declare class DriverOptionNotSetError extends Error {
    name: string;
    constructor(optionName: string);
}
