/**
 */
export class QueryRunnerAlreadyReleasedError extends Error {
    name = "QueryRunnerAlreadyReleasedError";

    constructor() {
        super();
        Object.setPrototypeOf(this, QueryRunnerAlreadyReleasedError.prototype);
        this.message = `Query runner already released. Cannot run queries anymore.`;
    }

}