"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityMetadataNotFoundError = void 0;
const index_1 = require("../index");
/**
 */
class EntityMetadataNotFoundError extends Error {
    constructor(target) {
        super();
        this.name = "EntityMetadataNotFound";
        Object.setPrototypeOf(this, EntityMetadataNotFoundError.prototype);
        let targetName;
        if (target instanceof index_1.EntitySchema) {
            targetName = target.options.name;
        }
        else if (typeof target === "function") {
            targetName = target.name;
        }
        else if (typeof target === "object" && "name" in target) {
            targetName = target.name;
        }
        else {
            targetName = target;
        }
        this.message = `No metadata for "${targetName}" was found.`;
    }
}
exports.EntityMetadataNotFoundError = EntityMetadataNotFoundError;

//# sourceMappingURL=EntityMetadataNotFoundError.js.map
