import {EntityTarget} from "../common/EntityTarget";
import {EntitySchema} from "../index";
import {TypeORMError} from "./TypeORMError";

/**
 * Thrown when no result could be found in methods which are not allowed to return undefined or an empty set.
 */
export class EntityNotFoundError extends TypeORMError {
    constructor(entityClass: EntityTarget<any>, criteria: any) {
        super();

        this.message = `Could not find any entity of type "${this.stringifyTarget(entityClass)}" ` +
            `matching: ${this.stringifyCriteria(criteria)}`;
    }

    private stringifyTarget(target: EntityTarget<any>): string {
        if (target instanceof EntitySchema) {
            return target.options.name;
        } else if (typeof target === "function") {
            return target.name;
        } else if (typeof target === "object" && "name" in target) {
            return target.name;
        } else {
            return target;
        }
    }

    private stringifyCriteria(criteria: any): string {
        try {
            return JSON.stringify(criteria, null, 4);
        } catch (e) { }
        return "" + criteria;
    }
}
