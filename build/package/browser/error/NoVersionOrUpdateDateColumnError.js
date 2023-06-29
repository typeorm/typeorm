/**
 * Thrown when an entity does not have no version and no update date column.
 */
export class NoVersionOrUpdateDateColumnError extends Error {
    constructor(entity) {
        super();
        this.name = "NoVersionOrUpdateDateColumnError";
        Object.setPrototypeOf(this, NoVersionOrUpdateDateColumnError.prototype);
        this.message = `Entity ${entity} does not have version or update date columns.`;
    }
}

//# sourceMappingURL=NoVersionOrUpdateDateColumnError.js.map
