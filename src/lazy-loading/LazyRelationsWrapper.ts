import {RelationMetadata} from "../metadata/RelationMetadata";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {Connection} from "../connection/Connection";

/**
 * This class wraps entities and provides functions there to lazily load its relations.
 */
export class LazyRelationsWrapper {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    wrap(object: Object, relation: RelationMetadata) {
        const connection = this.connection;
        const index = "__" + relation.propertyName + "__";
        const promiseIndex = "__promise__" + relation.propertyName + "__";
        const resolveIndex = "__has__" + relation.propertyName + "__";

        Object.defineProperty(object, relation.propertyName, {
            get: function() {
                if (this[resolveIndex] === true)
                    return Promise.resolve(this[index]);
                if (this[promiseIndex])
                    return this[promiseIndex];

                // create shortcuts for better readability
                const escapeAlias = (alias: string) => connection.driver.escapeAliasName(alias);
                const escapeColumn = (column: string) => connection.driver.escapeColumnName(column);

                const qb = new QueryBuilder(connection);
                if (relation.isManyToMany) {

                    if (relation.isManyToManyOwner) {
                        qb.select(relation.propertyName)
                            .from(relation.type, relation.propertyName)
                            .innerJoin(relation.junctionEntityMetadata.table.name, relation.junctionEntityMetadata.table.name,
                                `${escapeAlias(relation.junctionEntityMetadata.table.name)}.${escapeColumn(relation.joinTable.joinColumnName)}=:${relation.propertyName}Id AND ` +
                                `${escapeAlias(relation.junctionEntityMetadata.table.name)}.${escapeColumn(relation.joinTable.inverseJoinColumnName)}=${escapeAlias(relation.propertyName)}.${escapeColumn(relation.joinTable.referencedColumn.propertyName)}`)
                            .setParameter(relation.propertyName + "Id", this[relation.referencedColumn.propertyName]);

                    } else { // non-owner
                        qb.select(relation.propertyName)
                            .from(relation.type, relation.propertyName)
                            .innerJoin(relation.junctionEntityMetadata.table.name, relation.junctionEntityMetadata.table.name,
                                `${escapeAlias(relation.junctionEntityMetadata.table.name)}.${escapeColumn(relation.inverseRelation.joinTable.inverseJoinColumnName)}=:${relation.propertyName}Id AND ` +
                                `${escapeAlias(relation.junctionEntityMetadata.table.name)}.${escapeColumn(relation.inverseRelation.joinTable.joinColumnName)}=${escapeAlias(relation.propertyName)}.${escapeColumn(relation.inverseRelation.joinTable.referencedColumn.propertyName)}`)
                            .setParameter(relation.propertyName + "Id", this[relation.inverseRelation.referencedColumn.propertyName]);
                    }

                    this[promiseIndex] = qb.getMany().then(results => {
                        this[index] = results;
                        this[resolveIndex] = true;
                        delete this[promiseIndex];
                        return this[index];
                    }).catch(err => {
                        throw err;
                    });
                    return this[promiseIndex];

                } else if (relation.isOneToMany) {

                    qb.select(relation.propertyName)
                        .from(relation.inverseRelation.entityMetadata.target, relation.propertyName)
                        .innerJoin(`${relation.propertyName}.${relation.inverseRelation.propertyName}`, relation.entityMetadata.targetName)
                        .where(relation.entityMetadata.targetName + "." + relation.inverseEntityMetadata.firstPrimaryColumn.propertyName + "=:id", { id: relation.entityMetadata.getEntityIdMixedMap(this) });

                    this[promiseIndex] = qb.getMany().then(results => {
                        this[index] = results;
                        this[resolveIndex] = true;
                        delete this[promiseIndex];
                        return this[index];

                    }).catch(err => {
                        throw err;
                    });
                    return this[promiseIndex];

                } else {

                    if (relation.hasInverseSide) {
                        qb.select(relation.propertyName)
                            .from(relation.inverseRelation.entityMetadata.target, relation.propertyName)
                            .innerJoin(`${relation.propertyName}.${relation.inverseRelation.propertyName}`, relation.entityMetadata.targetName)
                            .where(relation.entityMetadata.targetName + "." + relation.joinColumn.referencedColumn.fullName + "=:id", { id: relation.entityMetadata.getEntityIdMixedMap(this) }); // is referenced column usage is correct here?

                    } else {
                        // (ow) post.category<=>category.post
                        // loaded: category from post
                        // example: SELECT category.id AS category_id, category.name AS category_name FROM category category
                        //              INNER JOIN post Post ON Post.category=category.id WHERE Post.id=1
                        qb.select(relation.propertyName) // category
                            .from(relation.type, relation.propertyName) // Category, category
                            .innerJoin(relation.entityMetadata.target as Function, relation.entityMetadata.name,
                                `${escapeAlias(relation.entityMetadata.name)}.${escapeColumn(relation.propertyName)}=${escapeAlias(relation.propertyName)}.${escapeColumn(relation.referencedColumn.propertyName)}`)
                            .where(relation.entityMetadata.name + "." + relation.joinColumn.referencedColumn.fullName + "=:id", { id: relation.entityMetadata.getEntityIdMixedMap(this) }); // is referenced column usage is correct here?
                    }

                    this[promiseIndex] = qb.getOne().then(result => {
                        this[index] = result;
                        this[resolveIndex] = true;
                        delete this[promiseIndex];
                        return this[index];

                    }).catch(err => {
                        throw err;
                    });
                    return this[promiseIndex];
                }
            },
            set: function(promise: Promise<any>) {
                if (promise instanceof Promise) {
                    promise.then(result => {
                        this[index] = result;
                        this[resolveIndex] = true;
                    });
                } else {
                    this[index] = promise;
                    this[resolveIndex] = true;
                }
            },
            configurable: true
        });
    }

}