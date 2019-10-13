/**
 * Thrown when ORM cannot get method parameter's type.
 * Basically, when reflect-metadata is not available or tsconfig is not properly setup.
 */
export declare class CannotReflectMethodParameterTypeError extends Error {
    name: string;
    constructor(target: Function, methodName: string);
}
