export class PrimaryColumnCannotBeNullableError extends Error {
    name = "PrimaryColumnCannotBeNullableError";

    constructor(object: Object, propertyName: string) {
        super();
        Object.setPrototypeOf(this, PrimaryColumnCannotBeNullableError.prototype);
        this.message = `Primary column ${(<any>object.constructor).name}#${propertyName} cannot be nullable. ` +
            `Its not allowed for primary keys. Try to remove nullable option.`;
    }

}