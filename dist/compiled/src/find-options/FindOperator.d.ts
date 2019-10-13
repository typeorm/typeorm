import { FindOperatorType } from "./FindOperatorType";
import { Connection } from "../";
/**
 * Find Operator used in Find Conditions.
 */
export declare class FindOperator<T> {
    /**
     * Operator type.
     */
    private _type;
    /**
     * Parameter value.
     */
    private _value;
    /**
     * Indicates if parameter is used or not for this operator.
     */
    private _useParameter;
    /**
     * Indicates if multiple parameters must be used for this operator.
     */
    private _multipleParameters;
    constructor(type: FindOperatorType, value: T | FindOperator<T>, useParameter?: boolean, multipleParameters?: boolean);
    /**
     * Indicates if parameter is used or not for this operator.
     * Extracts final value if value is another find operator.
     */
    readonly useParameter: boolean;
    /**
     * Indicates if multiple parameters must be used for this operator.
     * Extracts final value if value is another find operator.
     */
    readonly multipleParameters: boolean;
    /**
     * Gets the final value needs to be used as parameter value.
     */
    readonly value: T;
    /**
     * Gets SQL needs to be inserted into final query.
     */
    toSql(connection: Connection, aliasPath: string, parameters: string[]): string;
}
