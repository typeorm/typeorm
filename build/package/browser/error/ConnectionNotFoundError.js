import { TypeORMError } from "./TypeORMError";
/**
 * Thrown when consumer tries to get connection that does not exist.
 */
export class ConnectionNotFoundError extends TypeORMError {
    constructor(name) {
        super(`Connection "${name}" was not found.`);
    }
}

//# sourceMappingURL=ConnectionNotFoundError.js.map
