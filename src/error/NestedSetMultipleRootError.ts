export class NestedSetMultipleRootError extends Error {
    name = "NestedSetMultipleRootError";

    constructor() {
        super();
        Object.setPrototypeOf(this, NestedSetMultipleRootError.prototype);
        this.message = `Nested sets do not support multiple root entities.`;
    }

}