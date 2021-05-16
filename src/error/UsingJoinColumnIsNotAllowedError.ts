import {EntityMetadata} from "../metadata/EntityMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";

/**
 */
export class UsingJoinColumnIsNotAllowedError extends Error {
    name = "UsingJoinColumnIsNotAllowedError";

    constructor(entityMetadata: EntityMetadata, relation: RelationMetadata) {
        super();
        Object.setPrototypeOf(this, UsingJoinColumnIsNotAllowedError.prototype);
        this.message = `Using JoinColumn on ${entityMetadata.name}#${relation.propertyName} is wrong. ` +
            `You can use JoinColumn only on one-to-one and many-to-one relations.`;
    }

}