/**
 * This class stores query and its parameters
 */
export class Query {
    constructor(query, parameters) {
        this.query = query;
        this.parameters = parameters;
        this["@instanceof"] = Symbol.for("Query");
    }
}

//# sourceMappingURL=Query.js.map
