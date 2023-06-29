"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryNotFoundError = void 0;
const index_1 = require("../index");
/**
 * Thrown when repository for the given class is not found.
 */
class RepositoryNotFoundError extends Error {
    constructor(connectionName, entityClass) {
        super();
        this.name = "RepositoryNotFoundError";
        Object.setPrototypeOf(this, RepositoryNotFoundError.prototype);
        let targetName;
        if (entityClass instanceof index_1.EntitySchema) {
            targetName = entityClass.options.name;
        }
        else if (typeof entityClass === "function") {
            targetName = entityClass.name;
        }
        else if (typeof entityClass === "object" && "name" in entityClass) {
            targetName = entityClass.name;
        }
        else {
            targetName = entityClass;
        }
        this.message = `No repository for "${targetName}" was found. Looks like this entity is not registered in ` +
            `current "${connectionName}" connection?`;
    }
}
exports.RepositoryNotFoundError = RepositoryNotFoundError;

//# sourceMappingURL=RepositoryNotFoundError.js.map
