import {FindOperator} from "../FindOperator";
import {Connection} from "../..";

/**
 * Find Options Operator.
 * Example: { someField: Like("%some sting%") }
 */
class LikeOperator<T> extends FindOperator<T> {
    constructor(value: FindOperator<T> | T) {
        super(value);
    }

    toSql(connection: Connection, aliasPath: string, parameters: string[]): string {
        return `${aliasPath} LIKE ${parameters[0]}`;

    }
}

export const Like = <T>(value: T | FindOperator<T>) => new LikeOperator<T>(value);
