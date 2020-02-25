import {FindOperator} from "../FindOperator";
import {Connection} from "../..";

/**
 * Find Options Operator.
 * Example: { someField: Equal("value") }
 */
class EqualOperator<T> extends FindOperator<T> {
    constructor(value: FindOperator<T> | T) {
        super(value);
    }

    toSql(connection: Connection, aliasPath: string, parameters: string[]): string {
        return `${aliasPath} = ${parameters[0]}`;
    }
}

export const Equal = <T>(value: T|FindOperator<T>): EqualOperator<T> => new EqualOperator<T>(value);
