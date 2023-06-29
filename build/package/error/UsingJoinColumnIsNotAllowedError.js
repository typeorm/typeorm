"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsingJoinColumnIsNotAllowedError = void 0;
/**
 */
class UsingJoinColumnIsNotAllowedError extends Error {
    constructor(entityMetadata, relation) {
        super();
        this.name = "UsingJoinColumnIsNotAllowedError";
        Object.setPrototypeOf(this, UsingJoinColumnIsNotAllowedError.prototype);
        this.message = `Using JoinColumn on ${entityMetadata.name}#${relation.propertyName} is wrong. ` +
            `You can use JoinColumn only on one-to-one and many-to-one relations.`;
    }
}
exports.UsingJoinColumnIsNotAllowedError = UsingJoinColumnIsNotAllowedError;

//# sourceMappingURL=UsingJoinColumnIsNotAllowedError.js.map
