import {FindOperator} from "../FindOperator";
import {Connection} from "../..";

/**
 * Find Options Operator.
 * Used to negotiate expression.
 * Example: { title: not("hello") } will return entities where title not equal to "hello".
 */
class NotOperator<T> extends FindOperator<T> {
    constructor(value: FindOperator<T> | T) {
        super(value);
    }

    toSql(connection: Connection, aliasPath: string, parameters: string[]): string {
        if (this._value instanceof FindOperator) {
            return `NOT(${this._value.toSql(connection, aliasPath, parameters)})`;
        } else {
            return `${aliasPath} != ${parameters[0]}`;
        }
    }
}


export const Not = <T>(value: T | FindOperator<T>) => new NotOperator<T>(value);
