import {FindOperator} from "../FindOperator";
import {Connection} from "../..";

/**
 * Find Options Operator.
 * Example: { someField: MoreThan(10) }
 */
class MoreThanOperator<T> extends FindOperator<T> {
    constructor(value: FindOperator<T> | T) {
        super(value);
    }

    toSql(connection: Connection, aliasPath: string, parameters: string[]): string {
        return `${aliasPath} > ${parameters[0]}`;

    }
}

export const MoreThan = <T>(value: T | FindOperator<T>) => new MoreThanOperator<T>(value);
