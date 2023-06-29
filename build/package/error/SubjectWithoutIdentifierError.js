"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectWithoutIdentifierError = void 0;
/**
 * Thrown when operation is going to be executed on a subject without identifier.
 * This error should never be thrown, however it still presents to prevent user from updation or removing the whole table.
 * If this error occurs still, it most probably is an ORM internal problem which must be reported and fixed.
 */
class SubjectWithoutIdentifierError extends Error {
    constructor(subject) {
        super();
        this.name = "SubjectWithoutIdentifierError";
        Object.setPrototypeOf(this, SubjectWithoutIdentifierError.prototype);
        this.message = `Internal error. Subject ${subject.metadata.targetName} must have an identifier to perform operation. ` +
            `Please report a github issue if you face this error.`;
    }
}
exports.SubjectWithoutIdentifierError = SubjectWithoutIdentifierError;

//# sourceMappingURL=SubjectWithoutIdentifierError.js.map
