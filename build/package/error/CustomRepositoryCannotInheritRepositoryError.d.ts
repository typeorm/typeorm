/**
 * Thrown if custom repository inherits Repository class however entity is not set in @EntityRepository decorator.
 */
export declare class CustomRepositoryCannotInheritRepositoryError extends Error {
    name: string;
    constructor(repository: any);
}
