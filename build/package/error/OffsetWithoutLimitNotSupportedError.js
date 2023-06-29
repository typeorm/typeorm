"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OffsetWithoutLimitNotSupportedError = void 0;
/**
 * Thrown when user tries to build SELECT query using OFFSET without LIMIT applied but database does not support it.
*/
class OffsetWithoutLimitNotSupportedError extends Error {
    constructor() {
        super();
        this.name = "OffsetWithoutLimitNotSupportedError";
        Object.setPrototypeOf(this, OffsetWithoutLimitNotSupportedError.prototype);
        this.message = `RDBMS does not support OFFSET without LIMIT in SELECT statements. You must use limit in conjunction with offset function (or take in conjunction with skip function if you are using pagination).`;
    }
}
exports.OffsetWithoutLimitNotSupportedError = OffsetWithoutLimitNotSupportedError;

//# sourceMappingURL=OffsetWithoutLimitNotSupportedError.js.map
