import { TypeORMError } from "./TypeORMError"

/**
 * Thrown when trying to use named placeholders with an incompatible driver.
 */
export class DriverNotSupportNamedPlaceholdersError extends TypeORMError {
    constructor() {
        super(
            `Driver does not support named placeholders. Please update your query or switch to mysql2.`,
        )
    }
}
