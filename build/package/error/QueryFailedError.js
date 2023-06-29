"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryFailedError = void 0;
const ObjectUtils_1 = require("../util/ObjectUtils");
/**
 * Thrown when query execution has failed.
*/
class QueryFailedError extends Error {
    constructor(query, parameters, driverError) {
        super();
        Object.setPrototypeOf(this, QueryFailedError.prototype);
        this.message = driverError.toString()
            .replace(/^error: /, "")
            .replace(/^Error: /, "")
            .replace(/^Request/, "");
        ObjectUtils_1.ObjectUtils.assign(this, Object.assign(Object.assign({}, driverError), { name: "QueryFailedError", query: query, parameters: parameters || [] }));
    }
}
exports.QueryFailedError = QueryFailedError;

//# sourceMappingURL=QueryFailedError.js.map
