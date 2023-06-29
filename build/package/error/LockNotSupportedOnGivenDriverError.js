"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockNotSupportedOnGivenDriverError = void 0;
/**
 * Thrown when selected sql driver does not supports locking.
 */
class LockNotSupportedOnGivenDriverError extends Error {
    constructor() {
        super();
        this.name = "LockNotSupportedOnGivenDriverError";
        Object.setPrototypeOf(this, LockNotSupportedOnGivenDriverError.prototype);
        this.message = `Locking not supported on given driver.`;
    }
}
exports.LockNotSupportedOnGivenDriverError = LockNotSupportedOnGivenDriverError;

//# sourceMappingURL=LockNotSupportedOnGivenDriverError.js.map
