"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryNotTreeError = void 0;
const index_1 = require("../index");
/**
 * Thrown when repository for the given class is not found.
 */
class RepositoryNotTreeError extends Error {
    constructor(entityClass) {
        super();
        this.name = "RepositoryNotTreeError";
        Object.setPrototypeOf(this, RepositoryNotTreeError.prototype);
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
        this.message = `Repository of the "${targetName}" class is not a TreeRepository. Try to apply @Tree decorator on your entity.`;
    }
}
exports.RepositoryNotTreeError = RepositoryNotTreeError;

//# sourceMappingURL=RepositoryNotTreeError.js.map
