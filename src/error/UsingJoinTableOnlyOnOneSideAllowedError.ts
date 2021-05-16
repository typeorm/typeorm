import {EntityMetadata} from "../metadata/EntityMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";

/**
 */
export class UsingJoinTableOnlyOnOneSideAllowedError extends Error {
    name = "UsingJoinTableOnlyOnOneSideAllowedError";

    constructor(entityMetadata: EntityMetadata, relation: RelationMetadata) {
        super();
        Object.setPrototypeOf(this, UsingJoinTableOnlyOnOneSideAllowedError.prototype);
        this.message = `Using JoinTable is allowed only on one side of the many-to-many relationship. ` +
            `Both ${entityMetadata.name}#${relation.propertyName} and ${relation.inverseEntityMetadata.name}#${relation.inverseRelation!.propertyName} ` +
            `has JoinTable decorators. Choose one of them and left JoinColumn decorator only on it.`;
    }

}