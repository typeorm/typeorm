"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryRunnerProviderAlreadyReleasedError = void 0;
/**
 * Thrown when consumer tries to use query runner from query runner provider after it was released.
 */
class QueryRunnerProviderAlreadyReleasedError extends Error {
    constructor() {
        super();
        this.name = "QueryRunnerProviderAlreadyReleasedError";
        Object.setPrototypeOf(this, QueryRunnerProviderAlreadyReleasedError.prototype);
        this.message = `Database connection provided by a query runner was already released, cannot continue to use its querying methods anymore.`;
    }
}
exports.QueryRunnerProviderAlreadyReleasedError = QueryRunnerProviderAlreadyReleasedError;

//# sourceMappingURL=QueryRunnerProviderAlreadyReleasedError.js.map
