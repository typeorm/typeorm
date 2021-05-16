import {EntityTarget} from "../common/EntityTarget";
import {EntitySchema} from "../index";

/**
 * Thrown when repository for the given class is not found.
 */
export class RepositoryNotTreeError extends Error {
    name = "RepositoryNotTreeError";

    constructor(entityClass: EntityTarget<any>) {
        super();
        Object.setPrototypeOf(this, RepositoryNotTreeError.prototype);
        let targetName: string;
        if (entityClass instanceof EntitySchema) {
            targetName = entityClass.options.name;
        } else if (typeof entityClass === "function") {
            targetName = entityClass.name;
        } else if (typeof entityClass === "object" && "name" in entityClass) {
            targetName = entityClass.name;
        } else {
            targetName = entityClass;
        }
        this.message = `Repository of the "${targetName}" class is not a TreeRepository. Try to apply @Tree decorator on your entity.`;
    }

}
