/**
 * Thrown when consumer tries to execute operation allowed only if connection is opened.
 */
export class CannotExecuteNotConnectedError extends Error {
    name = "CannotExecuteNotConnectedError";

    constructor(connectionName: string) {
        super();
        this.message = `Cannot execute operation on "${connectionName}" connection because connection is not yet established.`;
        this.stack = new Error().stack;
    }

}