/**
 */
export class QueryRunnerAlreadyReleasedError extends Error {
    name = "QueryRunnerAlreadyReleasedError";

    constructor() {
        super();
        this.message = `Query runner already released. Cannot run queries anymore.`;
    }

}