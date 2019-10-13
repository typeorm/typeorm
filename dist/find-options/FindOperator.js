"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Find Operator used in Find Conditions.
 */
var FindOperator = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function FindOperator(type, value, useParameter, multipleParameters) {
        if (useParameter === void 0) { useParameter = true; }
        if (multipleParameters === void 0) { multipleParameters = false; }
        this._type = type;
        this._value = value;
        this._useParameter = useParameter;
        this._multipleParameters = multipleParameters;
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
        enumerable: true,
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
        enumerable: true,
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
        enumerable: true,
        configurable: true
    });
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Gets SQL needs to be inserted into final query.
     */
    FindOperator.prototype.toSql = function (connection, aliasPath, parameters) {
        switch (this._type) {
            case "not":
                if (this._value instanceof FindOperator) {
                    return "NOT(" + this._value.toSql(connection, aliasPath, parameters) + ")";
                }
                else {
                    return aliasPath + " != " + parameters[0];
                }
            case "lessThan":
                return aliasPath + " < " + parameters[0];
            case "lessThanOrEqual":
                return aliasPath + " <= " + parameters[0];
            case "moreThan":
                return aliasPath + " > " + parameters[0];
            case "moreThanOrEqual":
                return aliasPath + " >= " + parameters[0];
            case "equal":
                return aliasPath + " = " + parameters[0];
            case "like":
                return aliasPath + " LIKE " + parameters[0];
            case "between":
                return aliasPath + " BETWEEN " + parameters[0] + " AND " + parameters[1];
            case "in":
                return aliasPath + " IN (" + parameters.join(", ") + ")";
            case "any":
                return aliasPath + " = ANY(" + parameters[0] + ")";
            case "isNull":
                return aliasPath + " IS NULL";
            case "raw":
                if (this.value instanceof Function) {
                    return this.value(aliasPath);
                }
                else {
                    return aliasPath + " = " + this.value;
                }
        }
        return "";
    };
    return FindOperator;
}());
exports.FindOperator = FindOperator;
//# sourceMappingURL=FindOperator.js.map