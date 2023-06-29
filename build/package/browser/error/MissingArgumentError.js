/**
 * Thrown when null or undefined are passed into find or update
*/
export class MissingArgumentError extends Error {
    constructor() {
        super();
        Object.setPrototypeOf(this, MissingArgumentError.prototype);
        this.message = `You are passing null or undefined into a function that requires one`;
    }
}

//# sourceMappingURL=MissingArgumentError.js.map
