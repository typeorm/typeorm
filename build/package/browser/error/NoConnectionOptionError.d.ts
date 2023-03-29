/**
 * Thrown when some option is not set in the connection options.
 */
export declare class NoConnectionOptionError extends Error {
    constructor(optionName: string);
}
