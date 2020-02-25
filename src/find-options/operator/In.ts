import {FindOperator} from "../FindOperator";
import {Connection} from "../..";

/**
 * Find Options Operator.
 * Example: { someField: In([...]) }
 */
class InOperator<T> extends FindOperator<T> {
    constructor(value: FindOperator<T> | T) {
        super(value, true, true);
    }

    toSql(connection: Connection, aliasPath: string, parameters: string[]): string {
        return `${aliasPath} IN (${parameters.join(", ")})`;
    }
}

export const In = <T>(value: T[] | FindOperator<T>) => new InOperator<T>(value as any);
