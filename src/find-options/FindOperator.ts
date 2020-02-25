import {Connection} from "../";

/**
 * Find Operator used in Find Conditions.
 */
export abstract class FindOperator<T = any> {
    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    /**
     * Parameter value.
     */
    protected _value: T | FindOperator<T>;

    /**
     * Indicates if parameter is used or not for this operator.
     */
    protected _useParameter: boolean;

    /**
     * Indicates if multiple parameters must be used for this operator.
     */
    protected _multipleParameters: boolean;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    protected constructor(
        value: T | FindOperator<T>,
        useParameter: boolean = true,
        multipleParameters: boolean = false
    ) {
        this._value = value;
        this._useParameter = useParameter;
        this._multipleParameters = multipleParameters;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Indicates if parameter is used or not for this operator.
     * Extracts final value if value is another find operator.
     */
    get useParameter(): boolean {
        if (this._value instanceof FindOperator)
            return this._value.useParameter;

        return this._useParameter;
    }

    /**
     * Indicates if multiple parameters must be used for this operator.
     * Extracts final value if value is another find operator.
     */
    get multipleParameters(): boolean {
        if (this._value instanceof FindOperator)
            return this._value.multipleParameters;

        return this._multipleParameters;
    }

    /**
     * Gets the final value needs to be used as parameter value.
     */
    get value(): T {
        if (this._value instanceof FindOperator) return this._value.value;

        return this._value;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Gets SQL needs to be inserted into final query.
     * Construct a string for the SQL engine to use in the query.
     * This query must be made using the parameters to prevent SQL injection.
     *
     * Single parameter:
     *    `${aliasPath} = ANY(${parameters[0]})`
     *
     * Multiple parameters:
     *     `${aliasPath} IN (${parameters.join(", ")})`
     *
     * - Note: When using multiple parameters, remember to specify it in the constructor.
     */
    abstract toSql(connection: Connection, aliasPath: string, parameters: string[]): string;
}
