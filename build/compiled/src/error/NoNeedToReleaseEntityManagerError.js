"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNeedToReleaseEntityManagerError = void 0;
/**
 * Thrown when consumer tries to release entity manager that does not use single database connection.
 */
class NoNeedToReleaseEntityManagerError extends Error {
    constructor() {
        super();
        this.name = "NoNeedToReleaseEntityManagerError";
        Object.setPrototypeOf(this, NoNeedToReleaseEntityManagerError.prototype);
        this.message = `Entity manager is not using single database connection and cannot be released. ` +
            `Only entity managers created by connection#createEntityManagerWithSingleDatabaseConnection ` +
            `methods have a single database connection and they should be released.`;
    }
}
exports.NoNeedToReleaseEntityManagerError = NoNeedToReleaseEntityManagerError;
//# sourceMappingURL=NoNeedToReleaseEntityManagerError.js.map