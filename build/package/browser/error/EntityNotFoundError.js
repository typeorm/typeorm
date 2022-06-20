import { TypeORMError } from "./TypeORMError";
import { ObjectUtils } from "../util/ObjectUtils";
import { InstanceChecker } from "../util/InstanceChecker";
/**
 * Thrown when no result could be found in methods which are not allowed to return undefined or an empty set.
 */
export class EntityNotFoundError extends TypeORMError {
    constructor(entityClass, criteria) {
        super();
        this.message =
            `Could not find any entity of type "${this.stringifyTarget(entityClass)}" ` + `matching: ${this.stringifyCriteria(criteria)}`;
    }
    stringifyTarget(target) {
        if (InstanceChecker.isEntitySchema(target)) {
            return target.options.name;
        }
        else if (typeof target === "function") {
            return target.name;
        }
        else if (ObjectUtils.isObject(target) && "name" in target) {
            return target.name;
        }
        else {
            return target;
        }
    }
    stringifyCriteria(criteria) {
        try {
            return JSON.stringify(criteria, null, 4);
        }
        catch (e) { }
        return "" + criteria;
    }
}

//# sourceMappingURL=EntityNotFoundError.js.map
