/**
 * Thrown when consumer tries to use query runner from query runner provider after it was released.
 */
export class QueryRunnerProviderAlreadyReleasedError extends Error {
    name = "QueryRunnerProviderAlreadyReleasedError";

    constructor() {
        super();
        Object.setPrototypeOf(this, QueryRunnerProviderAlreadyReleasedError.prototype);
        this.message = `Database connection provided by a query runner was already released, cannot continue to use its querying methods anymore.`;
    }

}