/**
 * Thrown if custom repositories that extend AbstractRepository classes does not have managed entity.
 */
export declare class CustomRepositoryDoesNotHaveEntityError extends Error {
    name: string;
    constructor(repository: any);
}
