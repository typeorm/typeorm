import { TypeORMError } from "./TypeORMError";
export class UsingJoinColumnIsNotAllowedError extends TypeORMError {
    constructor(entityMetadata, relation) {
        super(`Using JoinColumn on ${entityMetadata.name}#${relation.propertyName} is wrong. ` +
            `You can use JoinColumn only on one-to-one and many-to-one relations.`);
    }
}

//# sourceMappingURL=UsingJoinColumnIsNotAllowedError.js.map
