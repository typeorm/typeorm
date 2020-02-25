import {FindOperator} from "../FindOperator";
import {Connection} from "../..";

/**
 * Find Options Operator.
 * Example: { someField: Any([...]) }
 */

class AnyOperator<T> extends FindOperator<T> {

    constructor(value: FindOperator<T> | T) {
        super(value);
    }

    toSql(connection: Connection, aliasPath: string, parameters: string[]): string {
        return `${aliasPath} = ANY(${parameters[0]})`;
    }
}

export const Any = <T>(value: T[]|FindOperator<T>) => new AnyOperator<T>(value as any);
