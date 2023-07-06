"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingArgumentError = void 0;
/**
 * Thrown when null or undefined are passed into find or update
*/
class MissingArgumentError extends Error {
    constructor() {
        super();
        Object.setPrototypeOf(this, MissingArgumentError.prototype);
        this.message = `You are passing null or undefined into a function that requires one`;
    }
}
exports.MissingArgumentError = MissingArgumentError;
//# sourceMappingURL=MissingArgumentError.js.map