import {FindOperator} from "../FindOperator";
import {Connection} from "../..";

/**
 * Find Options Operator.
 * Example: { someField: IsNull() }
 */
class IsNullOperator extends FindOperator {
    constructor() {
        super(undefined as any);
    }

    toSql(connection: Connection, aliasPath: string, parameters: string[]): string {
        return `${aliasPath} IS NULL`;
    }
}


export const IsNull = () => new IsNullOperator();
