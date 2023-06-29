"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrimaryColumnCannotBeNullableError = void 0;
class PrimaryColumnCannotBeNullableError extends Error {
    constructor(object, propertyName) {
        super();
        this.name = "PrimaryColumnCannotBeNullableError";
        Object.setPrototypeOf(this, PrimaryColumnCannotBeNullableError.prototype);
        this.message = `Primary column ${object.constructor.name}#${propertyName} cannot be nullable. ` +
            `Its not allowed for primary keys. Try to remove nullable option.`;
    }
}
exports.PrimaryColumnCannotBeNullableError = PrimaryColumnCannotBeNullableError;

//# sourceMappingURL=PrimaryColumnCannotBeNullableError.js.map
