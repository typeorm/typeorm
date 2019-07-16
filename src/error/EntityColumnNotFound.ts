/**
 *
 */
export class EntityColumnNotFound extends Error {
    name = "EntityColumnNotFound";

    constructor(propertyPath: string) {
        super();
        Object.setPrototypeOf(this, EntityColumnNotFound.prototype);
        this.message = `No entity column "${propertyPath}" was found.`;
    }

}
