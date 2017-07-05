/**
 * Thrown when consumer tries to release entity manager that does not use single database connection.
 */
export class NoNeedToReleaseEntityManagerError extends Error {
    name = "NoNeedToReleaseEntityManagerError";

    constructor() {
        super();
        this.message = `Entity manager is not using single database connection and cannot be released. ` +
            `Only entity managers created by connection#createEntityManagerWithSingleDatabaseConnection ` +
            `methods have a single database connection and they should be released.`;
        this.stack = new Error().stack;
    }

}