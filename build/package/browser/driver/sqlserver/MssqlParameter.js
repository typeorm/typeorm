/**
 * Sql server driver requires parameter types to be specified fo input parameters used in the query.
 *
 * @see https://github.com/patriksimek/node-mssql#data-types
 */
var MssqlParameter = /** @class */ (function () {
    function MssqlParameter(value, type) {
        var params = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            params[_i - 2] = arguments[_i];
        }
        this.value = value;
        this.type = type;
        // -------------------------------------------------------------------------
        // Public Properties
        // -------------------------------------------------------------------------
        this.params = [];
        this.params = params || [];
    }
    return MssqlParameter;
}());
export { MssqlParameter };

//# sourceMappingURL=MssqlParameter.js.map
