/**
 * Thrown when consumer specifies driver type that does not exist or supported.
 */
export class ParameterNotMatchError extends Error {
    name = "ParameterNotMatchError";

    constructor(message: string) {
        super();
        this.message = message;
        this.stack = new Error().stack;
    }

}