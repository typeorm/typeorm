import {EntityTarget} from "../common/EntityTarget";
import {EntitySchema} from "../index";

/**
 */
export class EntityMetadataNotFoundError extends Error {
    name = "EntityMetadataNotFound";

    constructor(target: EntityTarget<any>) {
        super();
        Object.setPrototypeOf(this, EntityMetadataNotFoundError.prototype);
        let targetName: string;
        if (target instanceof EntitySchema) {
            targetName = target.options.name;
        } else if (typeof target === "function") {
            targetName = target.name;
        } else if (typeof target === "object" && "name" in target) {
            targetName = target.name;
        } else {
            targetName = target;
        }
        this.message = `No metadata for "${targetName}" was found.`;
    }

}
