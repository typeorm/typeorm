/**
 * Find Operator used in Find Conditions.
 */
var FindOperator = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function FindOperator(type, value, useParameter, multipleParameters, getSql, objectLiteralParameters) {
        if (useParameter === void 0) { useParameter = true; }
        if (multipleParameters === void 0) { multipleParameters = false; }
        this._type = type;
        this._value = value;
        this._useParameter = useParameter;
        this._multipleParameters = multipleParameters;
        this._getSql = getSql;
        this._objectLiteralParameters = objectLiteralParameters;
    }
    Object.defineProperty(FindOperator.prototype, "useParameter", {
        // -------------------------------------------------------------------------
        // Accessors
        // -------------------------------------------------------------------------
        /**
         * Indicates if parameter is used or not for this operator.
         * Extracts final value if value is another find operator.
         */
        get: function () {
            if (this._value instanceof FindOperator)
                return this._value.useParameter;
            return this._useParameter;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FindOperator.prototype, "multipleParameters", {
        /**
         * Indicates if multiple parameters must be used for this operator.
         * Extracts final value if value is another find operator.
         */
        get: function () {
            if (this._value instanceof FindOperator)
                return this._value.multipleParameters;
            return this._multipleParameters;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FindOperator.prototype, "type", {
        /**
         * Gets the Type of this FindOperator
         */
        get: function () {
            return this._type;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FindOperator.prototype, "value", {
        /**
         * Gets the final value needs to be used as parameter value.
         */
        get: function () {
            if (this._value instanceof FindOperator)
                return this._value.value;
            return this._value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FindOperator.prototype, "objectLiteralParameters", {
        /**
         * Gets ObjectLiteral parameters.
         */
        get: function () {
            if (this._value instanceof FindOperator)
                return this._value.objectLiteralParameters;
            return this._objectLiteralParameters;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FindOperator.prototype, "child", {
        /**
         * Gets the child FindOperator if it exists
         */
        get: function () {
            if (this._value instanceof FindOperator)
                return this._value;
            return undefined;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FindOperator.prototype, "getSql", {
        /**
         * Gets the SQL generator
         */
        get: function () {
            if (this._value instanceof FindOperator)
                return this._value.getSql;
            return this._getSql;
        },
        enumerable: false,
        configurable: true
    });
    return FindOperator;
}());
export { FindOperator };

//# sourceMappingURL=FindOperator.js.map
