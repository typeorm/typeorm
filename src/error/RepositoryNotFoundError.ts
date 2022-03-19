import { EntityTarget } from "../common/EntityTarget"
import { TypeORMError } from "./TypeORMError"
import { ObjectUtils } from "../util/ObjectUtils"
import { InstanceChecker } from "../util/InstanceChecker"

/**
 * Thrown when repository for the given class is not found.
 */
export class RepositoryNotFoundError extends TypeORMError {
    constructor(connectionName: string, entityClass: EntityTarget<any>) {
        super()
        let targetName: string
        if (InstanceChecker.isEntitySchema(entityClass)) {
            targetName = entityClass.options.name
        } else if (typeof entityClass === "function") {
            targetName = entityClass.name
        } else if (
            ObjectUtils.isObject(entityClass) &&
            "name" in (entityClass as any)
        ) {
            targetName = (entityClass as any).name
        } else {
            targetName = entityClass as any
        }
        this.message =
            `No repository for "${targetName}" was found. Looks like this entity is not registered in ` +
            `current "${connectionName}" connection?`
    }
}
