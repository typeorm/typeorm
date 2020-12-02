import { Expression } from "../expression-builder/Expression";

/**
 * Used for find operations.
 */
export type FindConditions<T> = {
    [P in keyof T]?: FindConditions<T[P]> | Expression;
};
