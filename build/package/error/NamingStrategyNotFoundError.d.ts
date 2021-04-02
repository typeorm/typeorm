/**
 * Thrown when consumer tries to use naming strategy that does not exist.
 */
export declare class NamingStrategyNotFoundError extends Error {
    name: string;
    constructor(strategyName: string | Function, connectionName: string);
}
