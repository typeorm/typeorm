import {Connection, ObjectLiteral} from "../";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";

/**
 * Loads relation ids for the given entities.
 */
export class RelationIdLoader {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Loads relation ids of the given entity or entities.
     */
    async load(target: Function|string, relation: string, entities: ObjectLiteral|ObjectLiteral[], relatedEntities?: ObjectLiteral|ObjectLiteral[]): Promise<any[]>;

    /**
     * Loads relation ids of the given entity or entities.
     */
    async load(relation: RelationMetadata, entities: ObjectLiteral|ObjectLiteral[], relatedEntities?: ObjectLiteral|ObjectLiteral[]): Promise<any[]>;

    /**
     * Loads relation ids of the given entity or entities.
     */
    async load(relationOrTarget: RelationMetadata|Function|string, relationNameOrEntities: string|ObjectLiteral|ObjectLiteral[], entitiesOrRelatedEntities?: ObjectLiteral|ObjectLiteral[], maybeRelatedEntities?: ObjectLiteral|ObjectLiteral[]): Promise<any[]> {

        // normalize arguments
        let relation: RelationMetadata|undefined, entities: ObjectLiteral[], relatedEntities: ObjectLiteral[]|undefined;
        if (relationOrTarget instanceof RelationMetadata) {
            relation = relationOrTarget;
            entities = Array.isArray(relationNameOrEntities) ? relationNameOrEntities as ObjectLiteral[] : [relationNameOrEntities as ObjectLiteral];
            relatedEntities = Array.isArray(entitiesOrRelatedEntities) ? entitiesOrRelatedEntities as ObjectLiteral[] : (entitiesOrRelatedEntities ? [entitiesOrRelatedEntities as ObjectLiteral] : undefined);

        } else {
            const entityMetadata = this.connection.getMetadata(relationOrTarget);
            relation = entityMetadata.findRelationWithPropertyPath(relationNameOrEntities as string);
            if (!relation)
                throw new Error(`Relation "${relation}" was not found in "${entityMetadata.name}".`);

            entities = Array.isArray(entitiesOrRelatedEntities) ? entitiesOrRelatedEntities as ObjectLiteral[] : [entitiesOrRelatedEntities as ObjectLiteral];
            relatedEntities = Array.isArray(maybeRelatedEntities) ? maybeRelatedEntities as ObjectLiteral[] : (maybeRelatedEntities ? [maybeRelatedEntities as ObjectLiteral] : undefined);
        }

        // load relation ids depend of relation type
        if (relation.isManyToMany) {
            return this.loadForManyToMany(relation, entities, relatedEntities);

        } else if (relation.isManyToOne || relation.isOneToOneOwner) {
            return this.loadForManyToOneAndOneToOneOwner(relation, entities, relatedEntities);

        } else { // if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            return this.loadForOneToManyAndOneToOneNotOwner(relation, entities, relatedEntities);
        }
    }

    /**
     * Loads relation ids of the given entities and groups them into the object with parent and children.
     *
     * todo: extract this method?
     */
    async loadManyToManyRelationIdsAndGroup<E1 extends ObjectLiteral, E2 extends ObjectLiteral>(
        relation: RelationMetadata,
        entitiesOrEntities: E1|E1[],
        relatedEntityOrEntities?: E2|E2[]
    ): Promise<{ entity: E1, related?: E2|E2[] }[]> {

        // console.log("relation:", relation.propertyName);
        // console.log("entitiesOrEntities", entitiesOrEntities);
        const isMany = relation.isManyToMany || relation.isOneToMany;
        const entities: E1[] = Array.isArray(entitiesOrEntities) ? entitiesOrEntities : [entitiesOrEntities];

        if (!relatedEntityOrEntities) {
            relatedEntityOrEntities = await this.connection.relationLoader.load(relation, entitiesOrEntities);
            if (!relatedEntityOrEntities.length)
                return entities.map(entity => ({ entity: entity, related: isMany ? [] : undefined }));
        }
        // const relationIds = await this.load(relation, relatedEntityOrEntities!, entitiesOrEntities);
        const relationIds = await this.load(relation, entitiesOrEntities, relatedEntityOrEntities);
        // console.log("relationIds", relationIds);

        const relatedEntities: E2[] = Array.isArray(relatedEntityOrEntities) ? relatedEntityOrEntities : [relatedEntityOrEntities!];

        let columns: ColumnMetadata[], inverseColumns: ColumnMetadata[];
        if (relation.isManyToManyOwner) {
            columns = relation.junctionEntityMetadata!.inverseColumns.map(column => column.referencedColumn!);
            inverseColumns = relation.junctionEntityMetadata!.ownerColumns.map(column => column.referencedColumn!);

        } else if (relation.isManyToManyNotOwner) {
            columns = relation.junctionEntityMetadata!.ownerColumns.map(column => column.referencedColumn!);
            inverseColumns = relation.junctionEntityMetadata!.inverseColumns.map(column => column.referencedColumn!);

        } else if (relation.isManyToOne || relation.isOneToOneOwner) {
            columns = relation.joinColumns.map(column => column.referencedColumn!);
            inverseColumns = relation.entityMetadata.primaryColumns;

        } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            columns = relation.inverseRelation!.entityMetadata.primaryColumns;
            inverseColumns = relation.inverseRelation!.joinColumns.map(column => column.referencedColumn!);

        } else {

        }

        return entities.map(entity => {
            const group: { entity: E1, related?: E2|E2[] } = { entity: entity, related: isMany ? [] : undefined };
            relationIds.forEach(relationId => {
                const entityMatched = inverseColumns.every(column => {
                    return column.getEntityValue(entity) === relationId[column.entityMetadata.name + "_" + column.propertyPath.replace(".", "_")];
                });
                if (entityMatched) {
                    relatedEntities.forEach(relatedEntity => {
                        const relatedEntityMatched = columns.every(column => {
                            return column.getEntityValue(relatedEntity) === relationId[column.entityMetadata.name + "_" + relation.propertyPath.replace(".", "_") + "_" + column.propertyPath.replace(".", "_")];
                        });
                        if (relatedEntityMatched) {
                            if (isMany) {
                                (group.related as E2[]).push(relatedEntity);
                            } else {
                                group.related = relatedEntity;
                            }
                        }
                    });
                }
            });
            return group;
        });
    }

    /**
     * Loads relation ids of the given entities and maps them into the given entity property.

    async loadManyToManyRelationIdsAndMap(
        relation: RelationMetadata,
        entityOrEntities: ObjectLiteral|ObjectLiteral[],
        mapToEntityOrEntities: ObjectLiteral|ObjectLiteral[],
        propertyName: string
    ): Promise<void> {

        const relationIds = await this.loadManyToManyRelationIds(relation, entityOrEntities, mapToEntityOrEntities);
        const mapToEntities = mapToEntityOrEntities instanceof Array ? mapToEntityOrEntities : [mapToEntityOrEntities];
        const junctionMetadata = relation.junctionEntityMetadata!;
        const mainAlias = junctionMetadata.name;
        const columns = relation.isOwning ? junctionMetadata.inverseColumns : junctionMetadata.ownerColumns;
        const inverseColumns = relation.isOwning ? junctionMetadata.ownerColumns : junctionMetadata.inverseColumns;

        mapToEntities.forEach(mapToEntity => {
            mapToEntity[propertyName] = [];
            relationIds.forEach(relationId => {
                const match = inverseColumns.every(column => {
                    return column.referencedColumn!.getEntityValue(mapToEntity) === relationId[mainAlias + "_" + column.propertyName];
                });
                if (match) {
                    if (columns.length === 1) {
                        mapToEntity[propertyName].push(relationId[mainAlias + "_" + columns[0].propertyName]);

                    } else {
                        const value = {};
                        columns.forEach(column => {
                            column.referencedColumn!.setEntityValue(value, relationId[mainAlias + "_" + column.propertyName]);
                        });
                        mapToEntity[propertyName].push(value);
                    }
                }
            });
        });
    }*/

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Loads relation ids for the many-to-many relation.
     */
    protected loadForManyToMany(relation: RelationMetadata, entities: ObjectLiteral[], relatedEntities?: ObjectLiteral[]) {

        const junctionMetadata = relation.junctionEntityMetadata!;
        const mainAlias = junctionMetadata.name;
        const columns = relation.isOwning ? junctionMetadata.ownerColumns : junctionMetadata.inverseColumns;
        const inverseColumns = relation.isOwning ? junctionMetadata.inverseColumns : junctionMetadata.ownerColumns;
        const qb = this.connection.createQueryBuilder();

        // select all columns from junction table
        junctionMetadata.ownerColumns.forEach(column => {
            const columnName = column.referencedColumn!.entityMetadata.name + "_" + column.referencedColumn!.propertyPath.replace(".", "_");
            qb.addSelect(mainAlias + "." + column.propertyPath, columnName);
        });
        junctionMetadata.inverseColumns.forEach(column => {
            const columnName = column.referencedColumn!.entityMetadata.name + "_" + relation.propertyPath.replace(".", "_") + "_" + column.referencedColumn!.propertyPath.replace(".", "_");
            qb.addSelect(mainAlias + "." + column.propertyPath, columnName);
        });

        // add conditions for the given entities
        let condition1 = "";
        if (columns.length === 1) {
            qb.setParameter("values1", entities.map(entity => columns[0].referencedColumn!.getEntityValue(entity)));
            condition1 = mainAlias + "." + columns[0].propertyPath + " IN (:...values1)"; // todo: use ANY for postgres

        } else {
            condition1 = "(" + entities.map((entity, entityIndex) => {
                return columns.map(column => {
                    const paramName = "entity1_" + entityIndex + "_" + column.propertyName;
                    qb.setParameter(paramName, column.referencedColumn!.getEntityValue(entity));
                    return mainAlias + "." + column.propertyPath + " = :" + paramName;
                }).join(" AND ");
            }).map(condition => "(" + condition + ")").join(" OR ") + ")";
        }

        // add conditions for the given inverse entities
        let condition2 = "";
        if (relatedEntities) {
            if (inverseColumns.length === 1) {
                qb.setParameter("values2", relatedEntities.map(entity => inverseColumns[0].referencedColumn!.getEntityValue(entity)));
                condition2 = mainAlias + "." + inverseColumns[0].propertyPath + " IN (:...values2)"; // todo: use ANY for postgres

            } else {
                condition2 = "(" + relatedEntities.map((entity, entityIndex) => {
                    return inverseColumns.map(column => {
                        const paramName = "entity2_" + entityIndex + "_" + column.propertyName;
                        qb.setParameter(paramName, column.referencedColumn!.getEntityValue(entity));
                        return mainAlias + "." + column.propertyPath + " = :" + paramName;
                    }).join(" AND ");
                }).map(condition => "(" + condition + ")").join(" OR ") + ")";
            }
        }

        // execute query
        return qb
            .from(junctionMetadata.target, mainAlias)
            .where(condition1 + (condition2 ? " AND " + condition2 : ""))
            .getRawMany();
    }

    /**
     * Loads relation ids for the many-to-one and one-to-one owner relations.
     */
    protected loadForManyToOneAndOneToOneOwner(relation: RelationMetadata, entities: ObjectLiteral[], relatedEntities?: ObjectLiteral[]) {
        const mainAlias = relation.entityMetadata.targetName;

        // select all columns we need
        const qb = this.connection.createQueryBuilder();
        relation.entityMetadata.primaryColumns.forEach(primaryColumn => {
            const columnName = primaryColumn.entityMetadata.name + "_" + primaryColumn.propertyPath.replace(".", "_");
            qb.addSelect(mainAlias + "." + primaryColumn.propertyPath, columnName);
        });
        relation.joinColumns.forEach(column => {
            const columnName = column.referencedColumn!.entityMetadata.name + "_" + relation.propertyPath.replace(".", "_") + "_" + column.referencedColumn!.propertyPath.replace(".", "_");
            qb.addSelect(mainAlias + "." + column.propertyPath, columnName);
        });

        // add condition for entities
        let condition: string = "";
        if (relation.entityMetadata.primaryColumns.length === 1) {
            qb.setParameter("values", entities.map(entity => relation.entityMetadata.primaryColumns[0].getEntityValue(entity)));
            condition = mainAlias + "." + relation.entityMetadata.primaryColumns[0].propertyPath + " IN (:...values)";

        } else {
            condition = entities.map((entity, entityIndex) => {
                return relation.entityMetadata.primaryColumns.map((column, columnIndex) => {
                    const paramName = "entity" + entityIndex + "_" + columnIndex;
                    qb.setParameter(paramName, column.getEntityValue(entity));
                    return mainAlias + "." + column.propertyPath + " = :" + paramName;
                }).join(" AND ");
            }).map(condition => "(" + condition + ")").join(" OR ");
        }

        // execute query
        return qb.from(relation.entityMetadata.target, mainAlias)
            .where(condition)
            .getRawMany();
    }

    /**
     * Loads relation ids for the one-to-many and one-to-one not owner relations.
     */
    protected loadForOneToManyAndOneToOneNotOwner(relation: RelationMetadata, entities: ObjectLiteral[], relatedEntities?: ObjectLiteral[]) {
        relation = relation.inverseRelation!;
        const mainAlias = relation.entityMetadata.targetName;

        // select all columns we need
        const qb = this.connection.createQueryBuilder();
        relation.entityMetadata.primaryColumns.forEach(primaryColumn => {
            const columnName = primaryColumn.entityMetadata.name + "_" + relation.inverseRelation!.propertyPath.replace(".", "_") + "_" + primaryColumn.propertyPath.replace(".", "_");
            qb.addSelect(mainAlias + "." + primaryColumn.propertyPath, columnName);
        });
        relation.joinColumns.forEach(column => {
            const columnName = column.referencedColumn!.entityMetadata.name + "_" + column.referencedColumn!.propertyPath.replace(".", "_");
            qb.addSelect(mainAlias + "." + column.propertyPath, columnName);
        });

        // add condition for entities
        let condition: string = "";
        if (relation.joinColumns.length === 1) {
            qb.setParameter("values", entities.map(entity => relation.joinColumns[0].referencedColumn!.getEntityValue(entity)));
            condition = mainAlias + "." + relation.joinColumns[0].propertyPath + " IN (:...values)";

        } else {
            condition = entities.map((entity, entityIndex) => {
                return relation.joinColumns.map((joinColumn, joinColumnIndex) => {
                    const paramName = "entity" + entityIndex + "_" + joinColumnIndex;
                    qb.setParameter(paramName, joinColumn.referencedColumn!.getEntityValue(entity));
                    return mainAlias + "." + joinColumn.propertyPath + " = :" + paramName;
                }).join(" AND ");
            }).map(condition => "(" + condition + ")").join(" OR ");
        }

        // execute query
        return qb.from(relation.entityMetadata.target, mainAlias)
            .where(condition)
            .getRawMany();
    }

}
