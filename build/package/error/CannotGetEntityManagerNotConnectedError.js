"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CannotGetEntityManagerNotConnectedError = void 0;
/**
 * Thrown when consumer tries to access entity manager before connection is established.
 */
class CannotGetEntityManagerNotConnectedError extends Error {
    constructor(connectionName) {
        super();
        this.name = "CannotGetEntityManagerNotConnectedError";
        Object.setPrototypeOf(this, CannotGetEntityManagerNotConnectedError.prototype);
        this.message = `Cannot get entity manager for "${connectionName}" connection because connection is not yet established.`;
    }
}
exports.CannotGetEntityManagerNotConnectedError = CannotGetEntityManagerNotConnectedError;

//# sourceMappingURL=CannotGetEntityManagerNotConnectedError.js.map
