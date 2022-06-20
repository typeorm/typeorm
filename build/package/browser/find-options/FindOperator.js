import { InstanceChecker } from "../util/InstanceChecker";
/**
 * Find Operator used in Find Conditions.
 */
export class FindOperator {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(type, value, useParameter = true, multipleParameters = false, getSql, objectLiteralParameters) {
        this["@instanceof"] = Symbol.for("FindOperator");
        this._type = type;
        this._value = value;
        this._useParameter = useParameter;
        this._multipleParameters = multipleParameters;
        this._getSql = getSql;
        this._objectLiteralParameters = objectLiteralParameters;
    }
    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------
    /**
     * Indicates if parameter is used or not for this operator.
     * Extracts final value if value is another find operator.
     */
    get useParameter() {
        if (InstanceChecker.isFindOperator(this._value))
            return this._value.useParameter;
        return this._useParameter;
    }
    /**
     * Indicates if multiple parameters must be used for this operator.
     * Extracts final value if value is another find operator.
     */
    get multipleParameters() {
        if (InstanceChecker.isFindOperator(this._value))
            return this._value.multipleParameters;
        return this._multipleParameters;
    }
    /**
     * Gets the Type of this FindOperator
     */
    get type() {
        return this._type;
    }
    /**
     * Gets the final value needs to be used as parameter value.
     */
    get value() {
        if (InstanceChecker.isFindOperator(this._value))
            return this._value.value;
        return this._value;
    }
    /**
     * Gets ObjectLiteral parameters.
     */
    get objectLiteralParameters() {
        if (InstanceChecker.isFindOperator(this._value))
            return this._value.objectLiteralParameters;
        return this._objectLiteralParameters;
    }
    /**
     * Gets the child FindOperator if it exists
     */
    get child() {
        if (InstanceChecker.isFindOperator(this._value))
            return this._value;
        return undefined;
    }
    /**
     * Gets the SQL generator
     */
    get getSql() {
        if (InstanceChecker.isFindOperator(this._value))
            return this._value.getSql;
        return this._getSql;
    }
}

//# sourceMappingURL=FindOperator.js.map
