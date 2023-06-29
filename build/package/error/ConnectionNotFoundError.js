"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionNotFoundError = void 0;
/**
 * Thrown when consumer tries to get connection that does not exist.
 */
class ConnectionNotFoundError extends Error {
    constructor(name) {
        super();
        this.name = "ConnectionNotFoundError";
        Object.setPrototypeOf(this, ConnectionNotFoundError.prototype);
        this.message = `Connection "${name}" was not found.`;
    }
}
exports.ConnectionNotFoundError = ConnectionNotFoundError;

//# sourceMappingURL=ConnectionNotFoundError.js.map
