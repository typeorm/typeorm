import { RelationMetadata } from "../metadata/RelationMetadata";
/**
 * Thrown when relation has array initialized which is forbidden my ORM.
 *
 * @see https://github.com/typeorm/typeorm/issues/1319
 * @see http://typeorm.io/#/relations-faq/avoid-relation-property-initializers
 */
export declare class InitializedRelationError extends Error {
    constructor(relation: RelationMetadata);
}
