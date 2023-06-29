import { ObjectUtils } from "../util/ObjectUtils";
/**
 * Thrown when query execution has failed.
*/
export class QueryFailedError extends Error {
    constructor(query, parameters, driverError) {
        super();
        Object.setPrototypeOf(this, QueryFailedError.prototype);
        this.message = driverError.toString()
            .replace(/^error: /, "")
            .replace(/^Error: /, "")
            .replace(/^Request/, "");
        ObjectUtils.assign(this, Object.assign(Object.assign({}, driverError), { name: "QueryFailedError", query: query, parameters: parameters || [] }));
    }
}

//# sourceMappingURL=QueryFailedError.js.map
