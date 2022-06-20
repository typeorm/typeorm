import { ObjectUtils } from "../util/ObjectUtils";
import { TypeORMError } from "./TypeORMError";
/**
 * Thrown when query execution has failed.
 */
export class QueryFailedError extends TypeORMError {
    constructor(query, parameters, driverError) {
        super(driverError
            .toString()
            .replace(/^error: /, "")
            .replace(/^Error: /, "")
            .replace(/^Request/, ""));
        this.query = query;
        this.parameters = parameters;
        this.driverError = driverError;
        if (driverError) {
            const { name: _, // eslint-disable-line
            ...otherProperties } = driverError;
            ObjectUtils.assign(this, {
                ...otherProperties,
            });
        }
    }
}

//# sourceMappingURL=QueryFailedError.js.map
