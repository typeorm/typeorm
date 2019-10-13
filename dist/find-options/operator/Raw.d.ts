import { FindOperator } from "../FindOperator";
/**
 * Find Options Operator.
 * Example: { someField: Raw([...]) }
 */
export declare function Raw<T>(value: string | ((columnAlias?: string) => string)): FindOperator<any>;
