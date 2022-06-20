import { TypeORMError } from "./TypeORMError";
/**
 * Thrown when specified entity property was not found.
 */
export class EntityPropertyNotFoundError extends TypeORMError {
    constructor(propertyPath, metadata) {
        super(propertyPath);
        Object.setPrototypeOf(this, EntityPropertyNotFoundError.prototype);
        this.message = `Property "${propertyPath}" was not found in "${metadata.targetName}". Make sure your query is correct.`;
    }
}

//# sourceMappingURL=EntityPropertyNotFoundError.js.map
