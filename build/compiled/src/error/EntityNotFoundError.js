"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityNotFoundError = void 0;
const index_1 = require("../index");
/**
 * Thrown when no result could be found in methods which are not allowed to return undefined or an empty set.
 */
class EntityNotFoundError extends Error {
    constructor(entityClass, criteria) {
        super();
        this.name = "EntityNotFound";
        Object.setPrototypeOf(this, EntityNotFoundError.prototype);
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
        const criteriaString = this.stringifyCriteria(criteria);
        this.message = `Could not find any entity of type "${targetName}" matching: ${criteriaString}`;
    }
    stringifyCriteria(criteria) {
        try {
            return JSON.stringify(criteria, null, 4);
        }
        catch (e) { }
        return "" + criteria;
    }
}
exports.EntityNotFoundError = EntityNotFoundError;
//# sourceMappingURL=EntityNotFoundError.js.map