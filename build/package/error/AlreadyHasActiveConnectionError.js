"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlreadyHasActiveConnectionError = void 0;
/**
 * Thrown when consumer tries to recreate connection with the same name, but previous connection was not closed yet.
 */
class AlreadyHasActiveConnectionError extends Error {
    constructor(connectionName) {
        super();
        this.name = "AlreadyHasActiveConnectionError";
        Object.setPrototypeOf(this, AlreadyHasActiveConnectionError.prototype);
        this.message = `Cannot create a new connection named "${connectionName}", because connection with such name ` +
            `already exist and it now has an active connection session.`;
    }
}
exports.AlreadyHasActiveConnectionError = AlreadyHasActiveConnectionError;

//# sourceMappingURL=AlreadyHasActiveConnectionError.js.map
