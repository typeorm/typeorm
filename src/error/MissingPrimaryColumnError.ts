import {EntityMetadata} from "../metadata/EntityMetadata";

/**
 */
export class MissingPrimaryColumnError extends Error {
    name = "MissingPrimaryColumnError";

    constructor(entityMetadata: EntityMetadata) {
        super();
        Object.setPrototypeOf(this, MissingPrimaryColumnError.prototype);
        this.message = `Entity "${entityMetadata.name}" does not have a primary column. Primary column is required to ` +
            `have in all your entities. Use @PrimaryColumn decorator to add a primary column to your entity.`;
    }

}