import {FindOperator} from "../FindOperator";
import {Connection} from "../..";

/**
 * Find Options Operator.
 * Example: { someField: LessThanOrEqual(10) }
 */
class LessThanOrEqualOperator<T> extends FindOperator<T> {
    constructor(value: FindOperator<T> | T) {
        super(value);
    }

    toSql(connection: Connection, aliasPath: string, parameters: string[]): string {
        return `${aliasPath} <= ${parameters[0]}`;
    }
}


export const LessThanOrEqual = <T>(value: T | FindOperator<T>) => new LessThanOrEqualOperator<T>(value);
