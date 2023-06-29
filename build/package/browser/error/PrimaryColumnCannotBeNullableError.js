export class PrimaryColumnCannotBeNullableError extends Error {
    constructor(object, propertyName) {
        super();
        this.name = "PrimaryColumnCannotBeNullableError";
        Object.setPrototypeOf(this, PrimaryColumnCannotBeNullableError.prototype);
        this.message = `Primary column ${object.constructor.name}#${propertyName} cannot be nullable. ` +
            `Its not allowed for primary keys. Try to remove nullable option.`;
    }
}

//# sourceMappingURL=PrimaryColumnCannotBeNullableError.js.map
