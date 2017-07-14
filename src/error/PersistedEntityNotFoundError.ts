/**
 * Thrown . Theoretically can't be thrown.
 */
export class PersistedEntityNotFoundError extends Error {
    name = "PersistedEntityNotFoundError";

    constructor() {
        super();
        this.message = `Internal error. Persisted entity was not found in the list of prepared operated entities.`;
    }

}