"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectWithoutIdentifierError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when operation is going to be executed on a subject without identifier.
 * This error should never be thrown, however it still presents to prevent user from updation or removing the whole table.
 * If this error occurs still, it most probably is an ORM internal problem which must be reported and fixed.
 */
var SubjectWithoutIdentifierError = /** @class */ (function (_super) {
    tslib_1.__extends(SubjectWithoutIdentifierError, _super);
    function SubjectWithoutIdentifierError(subject) {
        var _this = _super.call(this) || this;
        _this.name = "SubjectWithoutIdentifierError";
        Object.setPrototypeOf(_this, SubjectWithoutIdentifierError.prototype);
        _this.message = "Internal error. Subject " + subject.metadata.targetName + " must have an identifier to perform operation. " +
            "Please report a github issue if you face this error.";
        return _this;
    }
    return SubjectWithoutIdentifierError;
}(Error));
exports.SubjectWithoutIdentifierError = SubjectWithoutIdentifierError;

//# sourceMappingURL=SubjectWithoutIdentifierError.js.map
