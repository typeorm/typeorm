import { TypeORMError } from "./TypeORMError"

/**
 * Thrown when user tries to build an UPDATE query with FROM but the database does not support it.
 */

export class FromOnUpdateNotSupportedError extends TypeORMError {
    constructor() {
        super(`Your database does not support FROM on UPDATE statements.`)
    }
}
