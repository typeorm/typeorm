import {FindOperator} from "../FindOperator";
import {Connection} from "../..";

/**
 * Find Options Operator.
 * Example: { someField: Between(x, y) }
 */

class BetweenOperator<T> extends FindOperator<T> {
    constructor(value: FindOperator<T> | T) {
        super(value, true, true);
    }

    toSql(connection: Connection, aliasPath: string, parameters: string[]): string {
        return `${aliasPath} BETWEEN ${parameters[0]} AND ${parameters[1]}`;
    }

}

export const Between = <T>(from: T | FindOperator<T>, to: T | FindOperator<T>) => new BetweenOperator<T>([from, to] as any);
