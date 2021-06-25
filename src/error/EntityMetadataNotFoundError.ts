import {EntityTarget} from "../common/EntityTarget";
import {EntitySchema} from "../entity-schema/EntitySchema";
import {TypeORMError} from "./TypeORMError";

export class EntityMetadataNotFoundError extends TypeORMError {
    constructor(target: EntityTarget<any>) {
        super();

        this.message = `No metadata for "${this.stringifyTarget(target)}" was found.`;
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
}
