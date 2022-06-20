/**
 * Sql server driver requires parameter types to be specified fo input parameters used in the query.
 *
 * @see https://github.com/patriksimek/node-mssql#data-types
 */
export class MssqlParameter {
    constructor(value, type, ...params) {
        this.value = value;
        this.type = type;
        this["@instanceof"] = Symbol.for("MssqlParameter");
        // -------------------------------------------------------------------------
        // Public Properties
        // -------------------------------------------------------------------------
        this.params = [];
        this.params = params || [];
    }
}

//# sourceMappingURL=MssqlParameter.js.map
