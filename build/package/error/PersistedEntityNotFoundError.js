"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistedEntityNotFoundError = void 0;
/**
 * Thrown . Theoretically can't be thrown.
 */
class PersistedEntityNotFoundError extends Error {
    constructor() {
        super();
        this.name = "PersistedEntityNotFoundError";
        Object.setPrototypeOf(this, PersistedEntityNotFoundError.prototype);
        this.message = `Internal error. Persisted entity was not found in the list of prepared operated entities.`;
    }
}
exports.PersistedEntityNotFoundError = PersistedEntityNotFoundError;

//# sourceMappingURL=PersistedEntityNotFoundError.js.map
