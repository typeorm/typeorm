import {EntityMetadata} from "../metadata/EntityMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";

/**
 */
export class UsingJoinColumnOnlyOnOneSideAllowedError extends Error {
    name = "UsingJoinColumnOnlyOnOneSideAllowedError";

    constructor(entityMetadata: EntityMetadata, relation: RelationMetadata) {
        super();
        Object.setPrototypeOf(this, UsingJoinColumnOnlyOnOneSideAllowedError.prototype);
        this.message = `Using JoinColumn is allowed only on one side of the one-to-one relationship. ` +
            `Both ${entityMetadata.name}#${relation.propertyName} and ${relation.inverseEntityMetadata.name}#${relation.inverseRelation!.propertyName} ` +
            `has JoinTable decorators. Choose one of them and left JoinTable decorator only on it.`;
    }

}