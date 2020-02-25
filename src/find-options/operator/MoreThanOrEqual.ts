import {FindOperator} from "../FindOperator";
import {Connection} from "../..";

/**
 * Find Options Operator.
 * Example: { someField: MoreThanOrEqual(10) }
 */
class MoreThanOrEqualOperator<T> extends FindOperator<T> {
    constructor(value: FindOperator<T> | T) {
        super(value);
    }

    toSql(connection: Connection, aliasPath: string, parameters: string[]): string {
        return `${aliasPath} >= ${parameters[0]}`;

    }
}

export const MoreThanOrEqual = <T>(value: T | FindOperator<T>) => new MoreThanOrEqualOperator<T>(value);
