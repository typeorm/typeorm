import {EntityTarget} from "../common/EntityTarget";
import {EntitySchema} from "../index";
import {TypeORMError} from "./TypeORMError";

/**
 * Thrown when repository for the given class is not found.
 */
export class RepositoryNotFoundError extends TypeORMError {
    constructor(connectionName: string, entityClass: EntityTarget<any>) {
        super();
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
