"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LimitOnUpdateNotSupportedError = void 0;
/**
 * Thrown when user tries to build an UPDATE query with LIMIT but the database does not support it.
*/
class LimitOnUpdateNotSupportedError extends Error {
    constructor() {
        super();
        this.name = "LimitOnUpdateNotSupportedError";
        Object.setPrototypeOf(this, LimitOnUpdateNotSupportedError.prototype);
        this.message = `Your database does not support LIMIT on UPDATE statements.`;
    }
}
exports.LimitOnUpdateNotSupportedError = LimitOnUpdateNotSupportedError;
//# sourceMappingURL=LimitOnUpdateNotSupportedError.js.map