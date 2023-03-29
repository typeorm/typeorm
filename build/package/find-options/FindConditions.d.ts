import { FindOperator } from "./FindOperator";
/**
 * Used for find operations.
 */
export declare type FindConditions<T> = {
    [P in keyof T]?: T[P] extends never ? FindConditions<T[P]> | FindOperator<FindConditions<T[P]>> : FindConditions<T[P]> | FindOperator<FindConditions<T[P]>>;
};
