/**
 * Thrown when an entity does not have no version and no update date column.
 */
export class NoVersionOrUpdateDateColumnError extends Error {
    name = "NoVersionOrUpdateDateColumnError";

    constructor(entity: string) {
        super();
        Object.setPrototypeOf(this, NoVersionOrUpdateDateColumnError.prototype);
        this.message = `Entity ${entity} does not have version or update date columns.`;
    }

}