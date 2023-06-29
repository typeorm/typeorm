/**
 * Thrown when selected sql driver does not supports locking.
 */
export class LockNotSupportedOnGivenDriverError extends Error {
    constructor() {
        super();
        this.name = "LockNotSupportedOnGivenDriverError";
        Object.setPrototypeOf(this, LockNotSupportedOnGivenDriverError.prototype);
        this.message = `Locking not supported on given driver.`;
    }
}

//# sourceMappingURL=LockNotSupportedOnGivenDriverError.js.map
