/**
 * Thrown when consumer tries to execute operation allowed only if connection is opened.
 */
export class CannotExecuteNotConnectedError extends Error {
    constructor(connectionName) {
        super();
        this.name = "CannotExecuteNotConnectedError";
        Object.setPrototypeOf(this, CannotExecuteNotConnectedError.prototype);
        this.message = `Cannot execute operation on "${connectionName}" connection because connection is not yet established.`;
    }
}

//# sourceMappingURL=CannotExecuteNotConnectedError.js.map
