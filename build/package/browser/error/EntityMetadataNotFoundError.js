import { TypeORMError } from "./TypeORMError";
import { ObjectUtils } from "../util/ObjectUtils";
import { InstanceChecker } from "../util/InstanceChecker";
export class EntityMetadataNotFoundError extends TypeORMError {
    constructor(target) {
        super();
        this.message = `No metadata for "${this.stringifyTarget(target)}" was found.`;
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
}

//# sourceMappingURL=EntityMetadataNotFoundError.js.map
