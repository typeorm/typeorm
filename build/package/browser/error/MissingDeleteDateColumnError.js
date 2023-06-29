/**
 */
export class MissingDeleteDateColumnError extends Error {
    constructor(entityMetadata) {
        super();
        this.name = "MissingDeleteDateColumnError";
        Object.setPrototypeOf(this, MissingDeleteDateColumnError.prototype);
        this.message = `Entity "${entityMetadata.name}" does not have delete date columns.`;
    }
}

//# sourceMappingURL=MissingDeleteDateColumnError.js.map
