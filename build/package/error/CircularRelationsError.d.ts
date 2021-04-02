/**
 * Thrown when circular relations detected with nullable set to false.
 */
export declare class CircularRelationsError extends Error {
    name: string;
    constructor(path: string);
}
