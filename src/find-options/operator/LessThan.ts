import {FindOperator} from "../FindOperator";
import {Connection} from "../..";

/**
 * Find Options Operator.
 * Example: { someField: LessThan(10) }
 */
class LessThanOperator<T> extends FindOperator<T> {
    constructor(value: FindOperator<T> | T) {
        super(value);
    }

    toSql(connection: Connection, aliasPath: string, parameters: string[]): string {
        return `${aliasPath} < ${parameters[0]}`;

    }
}

export const LessThan = <T>(value: T | FindOperator<T>) => new LessThanOperator<T>(value);
