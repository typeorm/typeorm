import {RelationMetadata} from "../metadata/RelationMetadata";
import {Connection} from "../connection/Connection";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {EntityManager} from "../entity-manager/EntityManager";

/**
 * Wraps entities and creates getters/setters for their relations
 * to be able to lazily load relations when accessing these relations.
 */
export class RelationLoader {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Loads relation data for the given entity and its relation.
     */
    load(relation: RelationMetadata, entity: ObjectLiteral, manager?: EntityManager): Promise<any> {
        if (relation.isManyToOne || relation.isOneToOneOwner) {
            return this.loadManyToOneOrOneToOneOwner(relation, entity, manager);

        } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            return this.loadOneToManyOrOneToOneNotOwner(relation, entity, manager);

        } else if (relation.isManyToManyOwner) {
            return this.loadManyToManyOwner(relation, entity, manager);

        } else { // many-to-many non owner
            return this.loadManyToManyNotOwner(relation, entity, manager);
        }
    }

    /**
     * Loads data for many-to-one and one-to-one owner relations.
     *
     * (ow) post.category<=>category.post
     * loaded: category from post
     * example: SELECT category.id AS category_id, category.name AS category_name FROM category category
     *              INNER JOIN post Post ON Post.category=category.id WHERE Post.id=1
     */
    loadManyToOneOrOneToOneOwner(relation: RelationMetadata, entity: ObjectLiteral, manager?: EntityManager): Promise<any> {
        const primaryColumns = relation.entityMetadata.primaryColumns;
        const joinColumns = relation.isOwning ? relation.joinColumns : relation.inverseRelation!.joinColumns;
        const conditions = joinColumns.map(joinColumn => {
            return `${relation.entityMetadata.name}.${relation.propertyName} = ${relation.propertyName}.${joinColumn.referencedColumn!.propertyName}`;
        }).join(" AND ");

        const qb = (manager || this.connection)
            .createQueryBuilder()
            .select(relation.propertyName) // category
            .from(relation.type, relation.propertyName) // Category, category
            .innerJoin(relation.entityMetadata.target as Function, relation.entityMetadata.name, conditions);

        primaryColumns.forEach(primaryColumn => {
            qb.andWhere(`${relation.entityMetadata.name}.${primaryColumn.propertyPath} = :${primaryColumn.propertyName}`)
                .setParameter(`${primaryColumn.propertyName}`, primaryColumn.getEntityValue(entity));
        });

        return qb.getOne();
    }

    /**
     * Loads data for one-to-many and one-to-one not owner relations.
     *
     * SELECT post
     * FROM post post
     * WHERE post.[joinColumn.name] = entity[joinColumn.referencedColumn]
     */
    loadOneToManyOrOneToOneNotOwner(relation: RelationMetadata, entity: ObjectLiteral, manager?: EntityManager): Promise<any> {
        const qb = (manager || this.connection)
            .createQueryBuilder()
            .select(relation.propertyName)
            .from(relation.inverseRelation!.entityMetadata.target, relation.propertyName);

        relation.inverseRelation!.joinColumns.forEach(joinColumn => {
            qb.andWhere(`${relation.propertyName}.${joinColumn.propertyName} = :${joinColumn.referencedColumn!.propertyName}`)
                .setParameter(`${joinColumn.referencedColumn!.propertyName}`, joinColumn.referencedColumn!.getEntityValue(entity));
        });
        return relation.isOneToMany ? qb.getMany() : qb.getOne();
    }

    /**
     * Loads data for many-to-many owner relations.
     *
     * SELECT category
     * FROM category category
     * INNER JOIN post_categories post_categories
     * ON post_categories.postId = :postId
     * AND post_categories.categoryId = category.id
     */
    loadManyToManyOwner(relation: RelationMetadata, entity: ObjectLiteral, manager?: EntityManager): Promise<any> {
        const mainAlias = relation.propertyName;
        const joinAlias = relation.junctionEntityMetadata!.tableName;
        const joinColumnConditions = relation.joinColumns.map(joinColumn => {
            return `${joinAlias}.${joinColumn.propertyName} = :${joinColumn.propertyName}`;
        });
        const inverseJoinColumnConditions = relation.inverseJoinColumns.map(inverseJoinColumn => {
            return `${joinAlias}.${inverseJoinColumn.propertyName}=${mainAlias}.${inverseJoinColumn.referencedColumn!.propertyName}`;
        });
        const parameters = relation.joinColumns.reduce((parameters, joinColumn) => {
            parameters[joinColumn.propertyName] = joinColumn.referencedColumn!.getEntityValue(entity);
            return parameters;
        }, {} as ObjectLiteral);

        return (manager || this.connection)
            .createQueryBuilder()
            .select(mainAlias)
            .from(relation.type, mainAlias)
            .innerJoin(joinAlias, joinAlias, [...joinColumnConditions, ...inverseJoinColumnConditions].join(" AND "))
            .setParameters(parameters)
            .getMany();
    }

    /**
     * Loads data for many-to-many not owner relations.
     *
     * SELECT post
     * FROM post post
     * INNER JOIN post_categories post_categories
     * ON post_categories.postId = post.id
     * AND post_categories.categoryId = post_categories.categoryId
     */
    loadManyToManyNotOwner(relation: RelationMetadata, entity: ObjectLiteral, manager?: EntityManager): Promise<any> {
        const mainAlias = relation.propertyName;
        const joinAlias = relation.junctionEntityMetadata!.tableName;
        const joinColumnConditions = relation.inverseRelation!.joinColumns.map(joinColumn => {
            return `${joinAlias}.${joinColumn.propertyName} = ${mainAlias}.${joinColumn.referencedColumn!.propertyName}`;
        });
        const inverseJoinColumnConditions = relation.inverseRelation!.inverseJoinColumns.map(inverseJoinColumn => {
            return `${joinAlias}.${inverseJoinColumn.propertyName} = :${inverseJoinColumn.propertyName}`;
        });
        const parameters = relation.inverseRelation!.inverseJoinColumns.reduce((parameters, joinColumn) => {
            parameters[joinColumn.propertyName] = joinColumn.referencedColumn!.getEntityValue(entity);
            return parameters;
        }, {} as ObjectLiteral);

        return (manager || this.connection)
            .createQueryBuilder()
            .select(mainAlias)
            .from(relation.type, mainAlias)
            .innerJoin(joinAlias, joinAlias, [...joinColumnConditions, ...inverseJoinColumnConditions].join(" AND "))
            .setParameters(parameters)
            .getMany();
    }

}
