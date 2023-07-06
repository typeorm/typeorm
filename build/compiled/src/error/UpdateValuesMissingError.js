"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateValuesMissingError = void 0;
/**
 * Thrown when user tries to update using QueryBuilder but do not specify what to update.
 */
class UpdateValuesMissingError extends Error {
    constructor() {
        super();
        this.name = "UpdateValuesMissingError";
        Object.setPrototypeOf(this, UpdateValuesMissingError.prototype);
        this.message = `Cannot perform update query because update values are not defined. Call "qb.set(...)" method to specify updated values.`;
    }
}
exports.UpdateValuesMissingError = UpdateValuesMissingError;
//# sourceMappingURL=UpdateValuesMissingError.js.map