/**
 * Thrown . Theoretically can't be thrown.
 */
export class PersistedEntityNotFoundError extends Error {
    constructor() {
        super();
        this.name = "PersistedEntityNotFoundError";
        Object.setPrototypeOf(this, PersistedEntityNotFoundError.prototype);
        this.message = `Internal error. Persisted entity was not found in the list of prepared operated entities.`;
    }
}

//# sourceMappingURL=PersistedEntityNotFoundError.js.map
