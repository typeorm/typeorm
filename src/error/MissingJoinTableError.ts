import {EntityMetadata} from "../metadata/EntityMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";

/**
 */
export class MissingJoinTableError extends Error {
    name = "MissingJoinTableError";

    constructor(entityMetadata: EntityMetadata, relation: RelationMetadata) {
        super();
        Object.setPrototypeOf(this, MissingJoinTableError.prototype);

        if (relation.inverseRelation) {
            this.message = `JoinTable is missing on both sides of ${entityMetadata.name}#${relation.propertyName} and ` +
                `${relation.inverseEntityMetadata.name}#${relation.inverseRelation.propertyName} many-to-many relationship. ` +
                `You need to put decorator decorator on one of the sides.`;
        } else {
            this.message = `JoinTable is missing on ${entityMetadata.name}#${relation.propertyName} many-to-many relationship. ` +
                `You need to put JoinTable decorator on it.`;
        }
    }

}