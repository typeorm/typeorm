"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MssqlParameter = void 0;
/**
 * Sql server driver requires parameter types to be specified fo input parameters used in the query.
 *
 * @see https://github.com/patriksimek/node-mssql#data-types
 */
class MssqlParameter {
    constructor(value, type, ...params) {
        this.value = value;
        this.type = type;
        // -------------------------------------------------------------------------
        // Public Properties
        // -------------------------------------------------------------------------
        this.params = [];
        this.params = params || [];
    }
}
exports.MssqlParameter = MssqlParameter;
//# sourceMappingURL=MssqlParameter.js.map