import {EntityMetadata} from "../metadata/EntityMetadata";

/**
 */
export class MissingDeleteDateColumnError extends Error {
    name = "MissingDeleteDateColumnError";

    constructor(entityMetadata: EntityMetadata) {
        super();
        Object.setPrototypeOf(this, MissingDeleteDateColumnError.prototype);
        this.message = `Entity "${entityMetadata.name}" does not have delete date columns.`;
    }

}