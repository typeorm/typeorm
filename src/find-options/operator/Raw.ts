import {FindOperator} from "../FindOperator";
import {Connection} from "../..";

type RawOperatorArgs = string|((columnAlias?: string) => string);

/**
 * Find Options Operator.
 * Example: { someField: Raw([...]) }
 */
class RawOperator extends FindOperator {

    constructor(value: RawOperatorArgs) {
        super(value);
    }

    toSql(connection: Connection, aliasPath: string, parameters: string[]): string {
        if (this.value instanceof Function) {
            return this.value(aliasPath);
        } else {
            return `${aliasPath} = ${this.value}`;
        }
    }
}


export function Raw(value: RawOperatorArgs): FindOperator {
    return new RawOperator(value);
}
