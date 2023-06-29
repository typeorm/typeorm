/**
 */
export class QueryRunnerAlreadyReleasedError extends Error {
    constructor() {
        super();
        this.name = "QueryRunnerAlreadyReleasedError";
        Object.setPrototypeOf(this, QueryRunnerAlreadyReleasedError.prototype);
        this.message = `Query runner already released. Cannot run queries anymore.`;
    }
}

//# sourceMappingURL=QueryRunnerAlreadyReleasedError.js.map
