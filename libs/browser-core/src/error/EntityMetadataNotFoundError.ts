import { EntitySchema } from "../entity-schema/EntitySchema";

/**
 */
export class EntityMetadataNotFoundError extends Error {
    name = "EntityMetadataNotFound";

    constructor(target: Function | EntitySchema<any> | string) {
        super();
        Object.setPrototypeOf(this, EntityMetadataNotFoundError.prototype);
        let targetName: string;
        if (target instanceof EntitySchema) {
            targetName = target.options.name;
        } else if (typeof target === "function") {
            targetName = target.name;
        } else {
            targetName = target;
        }
        this.message = `No metadata for "${targetName}" was found.`;
    }

}
