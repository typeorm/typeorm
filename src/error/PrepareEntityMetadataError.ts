import type { EntityMetadata } from "../metadata/EntityMetadata"
import { TypeORMError } from "./TypeORMError"

export class PrepareEntityMetadataError extends TypeORMError {
    constructor(metadata: EntityMetadata, cause: unknown) {
        super()

        const causeMessage =
            cause instanceof Error ? cause.message : String(cause)

        this.message = `prepareEntityMetadata hook failed for entity "${metadata.name}": ${causeMessage}`
    }
}
