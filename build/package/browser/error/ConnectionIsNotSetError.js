import { TypeORMError } from "./TypeORMError";
/**
 * Thrown when user tries to execute operation that requires connection to be established.
 */
export class ConnectionIsNotSetError extends TypeORMError {
    constructor(dbType) {
        super(`Connection with ${dbType} database is not established. Check connection configuration.`);
    }
}

//# sourceMappingURL=ConnectionIsNotSetError.js.map
