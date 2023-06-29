/**
 *
 */
export class EntityColumnNotFound extends Error {
    constructor(propertyPath) {
        super();
        this.name = "EntityColumnNotFound";
        Object.setPrototypeOf(this, EntityColumnNotFound.prototype);
        this.message = `No entity column "${propertyPath}" was found.`;
    }
}

//# sourceMappingURL=EntityColumnNotFound.js.map
