"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsingJoinColumnOnlyOnOneSideAllowedError = void 0;
/**
 */
class UsingJoinColumnOnlyOnOneSideAllowedError extends Error {
    constructor(entityMetadata, relation) {
        super();
        this.name = "UsingJoinColumnOnlyOnOneSideAllowedError";
        Object.setPrototypeOf(this, UsingJoinColumnOnlyOnOneSideAllowedError.prototype);
        this.message = `Using JoinColumn is allowed only on one side of the one-to-one relationship. ` +
            `Both ${entityMetadata.name}#${relation.propertyName} and ${relation.inverseEntityMetadata.name}#${relation.inverseRelation.propertyName} ` +
            `has JoinTable decorators. Choose one of them and left JoinTable decorator only on it.`;
    }
}
exports.UsingJoinColumnOnlyOnOneSideAllowedError = UsingJoinColumnOnlyOnOneSideAllowedError;

//# sourceMappingURL=UsingJoinColumnOnlyOnOneSideAllowedError.js.map
