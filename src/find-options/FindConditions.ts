import {FindOperator} from "./FindOperator";
import { ConjunctiveOperator } from "./ConjunctiveOperator";

/**
 * Used for find operations.
 */
export type FindConditions<T> = {
    [P in keyof T]?: FindConditions<T[P]>
        | FindOperator<FindConditions<T[P]>>
        | ConjunctiveOperator<FindConditions<T[P]>>;
};
