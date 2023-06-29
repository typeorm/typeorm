"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsingJoinTableOnlyOnOneSideAllowedError = void 0;
/**
 */
class UsingJoinTableOnlyOnOneSideAllowedError extends Error {
    constructor(entityMetadata, relation) {
        super();
        this.name = "UsingJoinTableOnlyOnOneSideAllowedError";
        Object.setPrototypeOf(this, UsingJoinTableOnlyOnOneSideAllowedError.prototype);
        this.message = `Using JoinTable is allowed only on one side of the many-to-many relationship. ` +
            `Both ${entityMetadata.name}#${relation.propertyName} and ${relation.inverseEntityMetadata.name}#${relation.inverseRelation.propertyName} ` +
            `has JoinTable decorators. Choose one of them and left JoinColumn decorator only on it.`;
    }
}
exports.UsingJoinTableOnlyOnOneSideAllowedError = UsingJoinTableOnlyOnOneSideAllowedError;

//# sourceMappingURL=UsingJoinTableOnlyOnOneSideAllowedError.js.map
