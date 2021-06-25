import {EntityTarget} from "../common/EntityTarget";
import {EntitySchema} from "../entity-schema/EntitySchema";
import {TypeORMError} from "./TypeORMError";

/**
 * Thrown when repository for the given class is not found.
 */
export class RepositoryNotTreeError extends TypeORMError {
    constructor(entityClass: EntityTarget<any>) {
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
        this.message = `Repository of the "${targetName}" class is not a TreeRepository. Try to apply @Tree decorator on your entity.`;
    }
}
