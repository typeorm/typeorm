/**
 */
export class UsingJoinColumnIsNotAllowedError extends Error {
    constructor(entityMetadata, relation) {
        super();
        this.name = "UsingJoinColumnIsNotAllowedError";
        Object.setPrototypeOf(this, UsingJoinColumnIsNotAllowedError.prototype);
        this.message = `Using JoinColumn on ${entityMetadata.name}#${relation.propertyName} is wrong. ` +
            `You can use JoinColumn only on one-to-one and many-to-one relations.`;
    }
}

//# sourceMappingURL=UsingJoinColumnIsNotAllowedError.js.map
