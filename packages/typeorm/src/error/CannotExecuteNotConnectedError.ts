import { TypeORMError } from "./TypeORMError"

/**
 * Thrown when consumer tries to execute operation allowed only if connection is opened.
 */
export class CannotExecuteNotConnectedError extends TypeORMError {
    constructor() {
        super(
            `Cannot execute operation because connection is not yet established.`,
        )
    }
}
