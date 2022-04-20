import { Connection, ObjectLiteral, QueryRunner } from "../";
import { RelationMetadata } from "../metadata/RelationMetadata";
/**
 * Wraps entities and creates getters/setters for their relations
 * to be able to lazily load relations when accessing these relations.
 */
export declare class RelationLoader {
    private connection;
    constructor(connection: Connection);
    /**
     * Loads relation data for the given entity and its relation.
     */
    load(relation: RelationMetadata, entityOrEntities: ObjectLiteral | ObjectLiteral[], queryRunner?: QueryRunner): Promise<any[]>;
    /**
     * Loads data for many-to-one and one-to-one owner relations.
     *
     * (ow) post.category<=>category.post
     * loaded: category from post
     * example: SELECT category.id AS category_id, category.name AS category_name FROM category category
     *              INNER JOIN post Post ON Post.category=category.id WHERE Post.id=1
     */
    loadManyToOneOrOneToOneOwner(relation: RelationMetadata, entityOrEntities: ObjectLiteral | ObjectLiteral[], queryRunner?: QueryRunner): Promise<any>;
    /**
     * Loads data for one-to-many and one-to-one not owner relations.
     *
     * SELECT post
     * FROM post post
     * WHERE post.[joinColumn.name] = entity[joinColumn.referencedColumn]
     */
    loadOneToManyOrOneToOneNotOwner(relation: RelationMetadata, entityOrEntities: ObjectLiteral | ObjectLiteral[], queryRunner?: QueryRunner): Promise<any>;
    /**
     * Loads data for many-to-many owner relations.
     *
     * SELECT category
     * FROM category category
     * INNER JOIN post_categories post_categories
     * ON post_categories.postId = :postId
     * AND post_categories.categoryId = category.id
     */
    loadManyToManyOwner(relation: RelationMetadata, entityOrEntities: ObjectLiteral | ObjectLiteral[], queryRunner?: QueryRunner): Promise<any>;
    /**
     * Loads data for many-to-many not owner relations.
     *
     * SELECT post
     * FROM post post
     * INNER JOIN post_categories post_categories
     * ON post_categories.postId = post.id
     * AND post_categories.categoryId = post_categories.categoryId
     */
    loadManyToManyNotOwner(relation: RelationMetadata, entityOrEntities: ObjectLiteral | ObjectLiteral[], queryRunner?: QueryRunner): Promise<any>;
    /**
     * Wraps given entity and creates getters/setters for its given relation
     * to be able to lazily load data when accessing this relation.
     */
    enableLazyLoad(relation: RelationMetadata, entity: ObjectLiteral, queryRunner?: QueryRunner): void;
}
