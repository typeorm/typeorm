"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CannotExecuteNotConnectedError = void 0;
/**
 * Thrown when consumer tries to execute operation allowed only if connection is opened.
 */
class CannotExecuteNotConnectedError extends Error {
    constructor(connectionName) {
        super();
        this.name = "CannotExecuteNotConnectedError";
        Object.setPrototypeOf(this, CannotExecuteNotConnectedError.prototype);
        this.message = `Cannot execute operation on "${connectionName}" connection because connection is not yet established.`;
    }
}
exports.CannotExecuteNotConnectedError = CannotExecuteNotConnectedError;

//# sourceMappingURL=CannotExecuteNotConnectedError.js.map
