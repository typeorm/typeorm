import { TypeORMError } from "./TypeORMError"

/**
 * Thrown when consumer tries to connect when he already connected.
 */
export class CannotConnectAlreadyConnectedError extends TypeORMError {
    constructor() {
        super(
            `Cannot initialize DataSource because it is already connected to the database.`,
        )
    }
}
