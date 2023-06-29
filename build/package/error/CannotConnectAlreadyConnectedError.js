"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CannotConnectAlreadyConnectedError = void 0;
/**
 * Thrown when consumer tries to connect when he already connected.
 */
class CannotConnectAlreadyConnectedError extends Error {
    constructor(connectionName) {
        super();
        this.name = "CannotConnectAlreadyConnectedError";
        Object.setPrototypeOf(this, CannotConnectAlreadyConnectedError.prototype);
        this.message = `Cannot create a "${connectionName}" connection because connection to the database already established.`;
    }
}
exports.CannotConnectAlreadyConnectedError = CannotConnectAlreadyConnectedError;

//# sourceMappingURL=CannotConnectAlreadyConnectedError.js.map
