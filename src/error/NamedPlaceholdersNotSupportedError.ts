import { TypeORMError } from "./TypeORMError"

/**
 * Thrown when trying to use named placeholders with an incompatible driver.
 */
export class NamedPlaceholdersNotSupportedError extends TypeORMError {
    constructor() {
        super(`Your driver does not support named placeholders.`)
    }
}
