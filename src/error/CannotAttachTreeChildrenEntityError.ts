/**
 * Thrown when user saves tree children entity but its parent is not saved yet.
*/
export class CannotAttachTreeChildrenEntityError extends Error {
    name = "CannotAttachTreeChildrenEntityError";

    constructor(entityName: string) {
        super();
        Object.setPrototypeOf(this, CannotAttachTreeChildrenEntityError.prototype);
        this.message = `Cannot attach entity "${entityName}" to its parent. Please make sure parent is saved in the database before saving children nodes.`;
    }

}