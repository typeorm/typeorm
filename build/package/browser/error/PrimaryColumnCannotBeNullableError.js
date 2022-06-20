import { TypeORMError } from "./TypeORMError";
export class PrimaryColumnCannotBeNullableError extends TypeORMError {
    constructor(object, propertyName) {
        super(`Primary column ${object.constructor.name}#${propertyName} cannot be nullable. ` +
            `Its not allowed for primary keys. Try to remove nullable option.`);
    }
}

//# sourceMappingURL=PrimaryColumnCannotBeNullableError.js.map
