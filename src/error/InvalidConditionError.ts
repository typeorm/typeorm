import { TypeORMError } from "./TypeORMError"
import type { EntityMetadata } from "../metadata/EntityMetadata"

export class InvalidConditionError extends TypeORMError {
    constructor(key: string, metadata: EntityMetadata) {
        super(`Invalid condition in "${key}" in ${metadata.name}`)
    }
}
