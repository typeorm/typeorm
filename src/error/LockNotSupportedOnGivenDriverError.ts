/**
 * Thrown when selected sql driver does not supports locking.
 */
export class LockNotSupportedOnGivenDriverError extends Error {
    name = "LockNotSupportedOnGivenDriverError";

    constructor() {
        super();
        Object.setPrototypeOf(this, LockNotSupportedOnGivenDriverError.prototype);
        this.message = `Locking not supported on given driver.`;
    }

}