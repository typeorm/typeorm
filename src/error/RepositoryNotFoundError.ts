import {EntityTarget} from "../common/EntityTarget";
import {EntitySchema} from "../index";

/**
 * Thrown when repository for the given class is not found.
 */
export class RepositoryNotFoundError extends Error {
    name = "RepositoryNotFoundError";

    constructor(connectionName: string, entityClass: EntityTarget<any>) {
        super();
        Object.setPrototypeOf(this, RepositoryNotFoundError.prototype);
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
        this.message = `No repository for "${targetName}" was found. Looks like this entity is not registered in ` +
            `current "${connectionName}" connection?`;
    }

}
