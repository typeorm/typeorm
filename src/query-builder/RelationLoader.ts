import {Connection, ObjectLiteral, QueryRunner} from "../";
import {RelationMetadata} from "../metadata/RelationMetadata";
import { And } from "../expression-builder/expression/logical/And";
import { Equal } from "../expression-builder/expression/comparison/Equal";
import { Col } from "../expression-builder/expression/Column";
import { In } from "../expression-builder/expression/comparison/In";
import { Or } from "../expression-builder/expression/logical/Or";

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
    load(relation: RelationMetadata, entityOrEntities: ObjectLiteral|ObjectLiteral[], queryRunner?: QueryRunner): Promise<any[]> { // todo: check all places where it uses non array
        if (queryRunner && queryRunner.isReleased) queryRunner = undefined; // get new one if already closed
        if (relation.isManyToOne || relation.isOneToOneOwner) {
            return this.loadManyToOneOrOneToOneOwner(relation, entityOrEntities, queryRunner);

        } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            return this.loadOneToManyOrOneToOneNotOwner(relation, entityOrEntities, queryRunner);

        } else if (relation.isManyToManyOwner) {
            return this.loadManyToManyOwner(relation, entityOrEntities, queryRunner);

        } else { // many-to-many non owner
            return this.loadManyToManyNotOwner(relation, entityOrEntities, queryRunner);
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
    loadManyToOneOrOneToOneOwner(relation: RelationMetadata, entityOrEntities: ObjectLiteral|ObjectLiteral[], queryRunner?: QueryRunner): Promise<any> {
        const entities = Array.isArray(entityOrEntities) ? entityOrEntities : [entityOrEntities];
        const columns = relation.entityMetadata.primaryColumns;
        const joinColumns = relation.isOwning ? relation.joinColumns : relation.inverseRelation!.joinColumns;
        const joinAliasName = relation.entityMetadata.name;
        const conditions = And(...joinColumns.map(joinColumn =>
            Equal(Col(joinAliasName, joinColumn), Col(relation.propertyName, joinColumn.referencedColumn!))));

        const qb = this.connection
            .createQueryBuilder(queryRunner)
            .select(relation.propertyName) // category
            .from(relation.type, relation.propertyName) // Category, category
            .innerJoin(relation.entityMetadata.target as Function, joinAliasName, conditions);

        if (columns.length === 1) {
            qb.where(In(Col(joinAliasName, columns[0]), entities.map(entity => columns[0].getEntityValue(entity))));
        } else {
            qb.where(
                Or(...entities.map(entity =>
                    And(...columns.map(column =>
                        Equal(Col(joinAliasName, column), column.getEntityValue(entity)))))));
        }

        return qb.getMany();
        // return qb.getOne(); todo: fix all usages
    }

    /**
     * Loads data for one-to-many and one-to-one not owner relations.
     *
     * SELECT post
     * FROM post post
     * WHERE post.[joinColumn.name] = entity[joinColumn.referencedColumn]
     */
    loadOneToManyOrOneToOneNotOwner(relation: RelationMetadata, entityOrEntities: ObjectLiteral|ObjectLiteral[], queryRunner?: QueryRunner): Promise<any> {
        const entities = Array.isArray(entityOrEntities) ? entityOrEntities : [entityOrEntities];
        const aliasName = relation.propertyName;
        const columns = relation.inverseRelation!.joinColumns;
        const qb = this.connection
            .createQueryBuilder(queryRunner)
            .select(aliasName)
            .from(relation.inverseRelation!.entityMetadata.target, aliasName);

        if (columns.length === 1) {
            qb.where(In(Col(aliasName, columns[0]), entities.map(entity => columns[0].referencedColumn!.getEntityValue(entity))));
        } else {
            qb.where(
                Or(...entities.map(entity =>
                    And(...columns.map(column =>
                        Equal(Col(aliasName, column), column.referencedColumn!.getEntityValue(entity)))))));
        }
        return qb.getMany();
        // return relation.isOneToMany ? qb.getMany() : qb.getOne(); todo: fix all usages
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
    loadManyToManyOwner(relation: RelationMetadata, entityOrEntities: ObjectLiteral|ObjectLiteral[], queryRunner?: QueryRunner): Promise<any> {
        const entities = Array.isArray(entityOrEntities) ? entityOrEntities : [entityOrEntities];
        const mainAlias = relation.propertyName;
        const joinAlias = relation.junctionEntityMetadata!.tableName;
        const joinColumnConditions = And(...relation.joinColumns.map(joinColumn =>
            In(Col(joinAlias, joinColumn), entities.map(entity => joinColumn.referencedColumn!.getEntityValue(entity)))));

        const inverseJoinColumnConditions = And(...relation.inverseJoinColumns.map(inverseJoinColumn =>
            Equal(Col(joinAlias, inverseJoinColumn), Col(mainAlias, inverseJoinColumn.referencedColumn!))));

        return this.connection
            .createQueryBuilder(queryRunner)
            .select(mainAlias)
            .from(relation.type, mainAlias)
            .innerJoin(joinAlias, joinAlias, And(joinColumnConditions, inverseJoinColumnConditions))
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
    loadManyToManyNotOwner(relation: RelationMetadata, entityOrEntities: ObjectLiteral|ObjectLiteral[], queryRunner?: QueryRunner): Promise<any> {
        const entities = Array.isArray(entityOrEntities) ? entityOrEntities : [entityOrEntities];
        const mainAlias = relation.propertyName;
        const joinAlias = relation.junctionEntityMetadata!.tableName;

        const joinColumnConditions = And(...relation.inverseRelation!.joinColumns.map(joinColumn =>
            Equal(Col(joinAlias, joinColumn), Col(mainAlias, joinColumn.referencedColumn!))));

        const inverseJoinColumnConditions = And(...relation.inverseRelation!.inverseJoinColumns.map(inverseJoinColumn =>
            In(Col(joinAlias, inverseJoinColumn), entities.map(entity => inverseJoinColumn.referencedColumn!.getEntityValue(entity)))));

        return this.connection
            .createQueryBuilder(queryRunner)
            .select(mainAlias)
            .from(relation.type, mainAlias)
            .innerJoin(joinAlias, joinAlias, And(joinColumnConditions, inverseJoinColumnConditions))
            .getMany();
    }

    /**
     * Wraps given entity and creates getters/setters for its given relation
     * to be able to lazily load data when accessing this relation.
     */
    enableLazyLoad(relation: RelationMetadata, entity: ObjectLiteral, queryRunner?: QueryRunner) {
        const relationLoader = this;
        const dataIndex = "__" + relation.propertyName + "__"; // in what property of the entity loaded data will be stored
        const promiseIndex = "__promise_" + relation.propertyName + "__"; // in what property of the entity loading promise will be stored
        const resolveIndex = "__has_" + relation.propertyName + "__"; // indicates if relation data already was loaded or not, we need this flag if loaded data is empty

        const setData = (entity: ObjectLiteral, value: any) => {
            entity[dataIndex] = value;
            entity[resolveIndex] = true;
            delete entity[promiseIndex];
            return value;
        };
        const setPromise = (entity: ObjectLiteral, value: Promise<any>) => {
            delete entity[resolveIndex];
            delete entity[dataIndex];
            entity[promiseIndex] = value;
            value.then(
              // ensure different value is not assigned yet
              result => entity[promiseIndex] === value ? setData(entity, result) : result
            );
            return value;
        };

        Object.defineProperty(entity, relation.propertyName, {
            get: function() {
                if (this[resolveIndex] === true || this[dataIndex] !== undefined) // if related data already was loaded then simply return it
                    return Promise.resolve(this[dataIndex]);

                if (this[promiseIndex]) // if related data is loading then return a promise relationLoader loads it
                    return this[promiseIndex];

                // nothing is loaded yet, load relation data and save it in the model once they are loaded
                const loader = relationLoader.load(relation, this, queryRunner).then(
                    result => relation.isOneToOne || relation.isManyToOne ? (result.length === 0 ? null : result[0]) : result
                );
                return setPromise(this, loader);
            },
            set: function(value: any|Promise<any>) {
                if (value instanceof Promise) { // if set data is a promise then wait for its resolve and save in the object
                    setPromise(this, value);
                } else { // if its direct data set (non promise, probably not safe-typed)
                    setData(this, value);
                }
            },
            configurable: true
        });
    }

}
