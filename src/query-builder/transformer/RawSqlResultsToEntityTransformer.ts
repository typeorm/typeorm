import {Driver} from "../../driver/Driver";
import {RelationIdLoadResult} from "../relation-id/RelationIdLoadResult";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {Alias} from "../Alias";
import {RelationCountLoadResult} from "../relation-count/RelationCountLoadResult";
import {RelationMetadata} from "../../metadata/RelationMetadata";
import {OrmUtils} from "../../util/OrmUtils";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {QueryExpressionMap} from "../QueryExpressionMap";

/**
 * Transforms raw sql results returned from the database into entity object.
 * Entity is constructed based on its entity metadata.
 */
export class RawSqlResultsToEntityTransformer {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected expressionMap: QueryExpressionMap,
                protected driver: Driver,
                protected rawRelationIdResults: RelationIdLoadResult[],
                protected rawRelationCountResults: RelationCountLoadResult[]) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Since db returns a duplicated rows of the data where accuracies of the same object can be duplicated
     * we need to group our result and we must have some unique id (primary key in our case)
     */
    transform(rawResults: any[], alias: Alias): any[] {
        const group = this.group(rawResults, alias);
        const entities: any[] = [];
        group.forEach(results => {
            const entity = this.transformRawResultsGroup(results, alias);
            if (entity !== undefined)
                entities.push(entity);
        });
        return entities;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Groups given raw results by ids of given alias.
     */
    protected group(rawResults: any[], alias: Alias): Map<string, any[]> {
        const map = new Map();
        const keys = alias.metadata.primaryColumns.map(column => alias.name + "_" + column.databaseName);
        rawResults.forEach(rawResult => {
            const id = keys.map(key => rawResult[key]).join("_"); // todo: check partial
            if (!id) return;

            const items = map.get(id);
            if (!items) {
                map.set(id, [rawResult]);
            } else {
                items.push(rawResult);
            }
        });
        return map;
    }

    /**
     * Transforms set of data results into single entity.
     */
    protected transformRawResultsGroup(rawResults: any[], alias: Alias): ObjectLiteral|undefined {
        let hasColumns = false, hasEmbeddedColumns = false, hasParentColumns = false, hasParentEmbeddedColumns = false, hasRelations = false, hasRelationIds = false, hasRelationCounts = false;
        let entity: any = alias.metadata.create();

        if (alias.metadata.discriminatorColumn) {
            const discriminatorValues = rawResults.map(result => result[alias.name + "_" + alias.metadata.discriminatorColumn!.databaseName]);
            const metadata = alias.metadata.childEntityMetadatas.find(childEntityMetadata => {
                return !!discriminatorValues.find(value => value === childEntityMetadata.discriminatorValue);
            });
            if (metadata)
                entity = metadata.create();
        }

        // get value from columns selections and put them into newly created entity
        hasColumns = this.transformColumns(rawResults, alias, entity, alias.metadata);

        hasRelations = this.transformJoins(rawResults, entity, alias);
        hasRelationIds = this.transformRelationIds(rawResults, alias, entity);
        hasRelationCounts = this.transformRelationCounts(rawResults, alias, entity);

        // this.removeVirtualColumns(entity, alias);

        return (hasColumns || hasEmbeddedColumns || hasParentColumns || hasParentEmbeddedColumns || hasRelations || hasRelationIds || hasRelationCounts) ? entity : undefined;
    }

    // get value from columns selections and put them into object
    protected transformColumns(rawResults: any[], alias: Alias, entity: ObjectLiteral, metadata: EntityMetadata): boolean {
        let hasData = false;
        metadata.columns.forEach(column => {
            const value = rawResults[0][alias.name + "_" + column.databaseName];
            if (value === undefined || column.isVirtual || column.isParentId || column.isDiscriminator)
                return;

            // if user does not selected the whole entity or he used partial selection and does not select this particular column
            // then we don't add this column and its value into the entity
            if (!this.expressionMap.selects.find(select => select.selection === alias.name || select.selection === alias.name + "." + column.propertyName))
                return;

            column.setEntityValue(entity, this.driver.prepareHydratedValue(value, column));
            if (value !== null) // we don't mark it as has data because if we will have all nulls in our object - we don't need such object
                hasData = true;
        });

        if (alias.metadata.parentEntityMetadata) {
            alias.metadata.parentEntityMetadata.columns.forEach(column => {
                const value = rawResults[0]["parentIdColumn_" + alias.metadata.parentEntityMetadata.tableName + "_" + column.databaseName];
                if (value === undefined || column.isVirtual || column.isParentId || column.isDiscriminator)
                    return;

                column.setEntityValue(entity, this.driver.prepareHydratedValue(value, column));
                if (value !== null) // we don't mark it as has data because if we will have all nulls in our object - we don't need such object
                    hasData = true;
            });
        }
        return hasData;
    }

    /**
     * Transforms joined entities in the given raw results by a given alias and stores to the given (parent) entity
     */
    protected transformJoins(rawResults: any[], entity: ObjectLiteral, alias: Alias) {
        let hasData = false;
        let discriminatorValue: string = "";

        if (alias.metadata.discriminatorColumn)
            discriminatorValue = rawResults[0][alias.name + "_" + alias.metadata.discriminatorColumn!.databaseName];

        this.expressionMap.joinAttributes.forEach(join => { // todo: we have problem here - when inner joins are used without selects it still create empty array

            // skip joins without metadata
            if (!join.metadata)
                return;

            // this check need to avoid setting properties than not belong to entity when single table inheritance used.
            const metadata = alias.metadata.childEntityMetadatas.find(childEntityMetadata => discriminatorValue === childEntityMetadata.discriminatorValue);
            if (metadata && join.relation && metadata.target !== join.relation.target)
                return;

            // some checks to make sure this join is for current alias
            if (join.mapToProperty) {
                if (join.mapToPropertyParentAlias !== alias.name)
                    return;
            } else {
                if (!join.relation || join.parentAlias !== alias.name || join.relationPropertyPath !== join.relation!.propertyPath)
                    return;
            }

            // transform joined data into entities
            const mappedEntities = this.transform(rawResults, join.alias);
            const result = !join.isMany ? mappedEntities[0] : mappedEntities;
            if (!result) // if nothing was joined then simply return
                return;

            // if join was mapped to some property then save result to that property
            if (join.mapToPropertyPropertyName) {
                entity[join.mapToPropertyPropertyName] = result; // todo: fix embeds

            } else { // otherwise set to relation
                join.relation!.setEntityValue(entity, result);
            }

            hasData = true;
        });
        return hasData;
    }

    protected transformRelationIds(rawSqlResults: any[], alias: Alias, entity: ObjectLiteral): boolean {
        let hasData = false;
        this.rawRelationIdResults.forEach(rawRelationIdResult => {
            if (rawRelationIdResult.relationIdAttribute.parentAlias !== alias.name)
                return;

            const relation = rawRelationIdResult.relationIdAttribute.relation;
            const valueMap = this.createValueMapFromJoinColumns(relation, rawRelationIdResult.relationIdAttribute.parentAlias, rawSqlResults);
            if (valueMap === undefined || valueMap === null)
                return;

            const idMaps = rawRelationIdResult.results.map(result => {
                const entityPrimaryIds = this.extractEntityPrimaryIds(relation, result);
                if (!alias.metadata.compareIds(entityPrimaryIds, valueMap))
                    return;

                let columns: ColumnMetadata[];
                if (relation.isManyToOne || relation.isOneToOneOwner) {
                    columns = relation.joinColumns.map(joinColumn => joinColumn);
                } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
                    columns = relation.inverseEntityMetadata.primaryColumns.map(joinColumn => joinColumn);
                } else { // ManyToMany
                    if (relation.isOwning) {
                        columns = relation.inverseJoinColumns.map(joinColumn => joinColumn);
                    } else {
                        columns = relation.inverseRelation!.joinColumns.map(joinColumn => joinColumn);
                    }
                }

                // const idMapColumns = (relation.isOneToMany || relation.isOneToOneNotOwner) ? columns : columns.map(column => column.referencedColumn!);
                // const idMap = idMapColumns.reduce((idMap, column) => {
                //     return OrmUtils.mergeDeep(idMap, column.createValueMap(result[column.databaseName]));
                // }, {} as ObjectLiteral); // need to create reusable function for this process

                const idMap = columns.reduce((idMap, column) => {
                    if (relation.isOneToMany || relation.isOneToOneNotOwner) {
                        return OrmUtils.mergeDeep(idMap, column.createValueMap(result[column.databaseName]));
                    } else {
                        return OrmUtils.mergeDeep(idMap, column.referencedColumn!.createValueMap(result[column.databaseName]));
                    }
                }, {} as ObjectLiteral);

                if (columns.length === 1 && rawRelationIdResult.relationIdAttribute.disableMixedMap === false) {
                    if (relation.isOneToMany || relation.isOneToOneNotOwner) {
                        return columns[0].getEntityValue(idMap);
                    } else {
                        return columns[0].referencedColumn!.getEntityValue(idMap);
                    }
                }
                return idMap;
            }).filter(result => result);

            const properties = rawRelationIdResult.relationIdAttribute.mapToPropertyPropertyPath.split(".");
            const mapToProperty = (properties: string[], map: ObjectLiteral, value: any): any => {

                const property = properties.shift();
                if (property && properties.length === 0) {
                    map[property] = value;
                    return map;
                } else if (property && properties.length > 0) {
                    mapToProperty(properties, map[property], value);
                } else {
                    return map;
                }
            };
            if (relation.isOneToOne || relation.isManyToOne) {
                if (idMaps[0] !== undefined) {
                    mapToProperty(properties, entity, idMaps[0]);
                    hasData = true;
                }
            } else {
                mapToProperty(properties, entity, idMaps);
                if (idMaps.length > 0) {
                    hasData = true;
                }
            }
        });

        return hasData;
    }

    protected transformRelationCounts(rawSqlResults: any[], alias: Alias, entity: ObjectLiteral): boolean {
        let hasData = false;
        this.rawRelationCountResults
            .filter(rawRelationCountResult => rawRelationCountResult.relationCountAttribute.parentAlias === alias.name)
            .forEach(rawRelationCountResult => {
                const relation = rawRelationCountResult.relationCountAttribute.relation;
                let referenceColumnName: string;

                if (relation.isOneToMany) {
                    referenceColumnName = relation.inverseRelation!.joinColumns[0].referencedColumn!.databaseName;  // todo: fix joinColumns[0]

                } else {
                    referenceColumnName = relation.isOwning ? relation.joinColumns[0].referencedColumn!.databaseName : relation.inverseRelation!.joinColumns[0].referencedColumn!.databaseName;
                }

                const referenceColumnValue = rawSqlResults[0][alias.name + "_" + referenceColumnName]; // we use zero index since its grouped data // todo: selection with alias for entity columns wont work
                if (referenceColumnValue !== undefined && referenceColumnValue !== null) {
                    entity[rawRelationCountResult.relationCountAttribute.mapToPropertyPropertyName] = 0;
                    rawRelationCountResult.results
                        .filter(result => result["parentId"] === referenceColumnValue)
                        .forEach(result => {
                            entity[rawRelationCountResult.relationCountAttribute.mapToPropertyPropertyName] = parseInt(result["cnt"]);
                            hasData = true;
                        });
                }
            });

        return hasData;
    }

    private createValueMapFromJoinColumns(relation: RelationMetadata, parentAlias: string, rawSqlResults: any[]): ObjectLiteral {
        let columns: ColumnMetadata[];
        if (relation.isManyToOne || relation.isOneToOneOwner) {
            columns = relation.entityMetadata.primaryColumns.map(joinColumn => joinColumn);
        } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            columns = relation.inverseRelation!.joinColumns.map(joinColumn => joinColumn);
        } else {
            if (relation.isOwning) {
                columns = relation.joinColumns.map(joinColumn => joinColumn);
            } else {
                columns = relation.inverseRelation!.inverseJoinColumns.map(joinColumn => joinColumn);
            }
        }
        return columns.reduce((valueMap, column) => {
            rawSqlResults.forEach(rawSqlResult => {
                if (relation.isManyToOne || relation.isOneToOneOwner) {
                    valueMap[column.databaseName] = rawSqlResult[parentAlias + "_" + column.databaseName];
                } else {
                    valueMap[column.databaseName] =  rawSqlResult[parentAlias + "_" + column.referencedColumn!.databaseName];
                }
            });
            return valueMap;
        }, {} as ObjectLiteral);

    }

    private extractEntityPrimaryIds(relation: RelationMetadata, relationIdRawResult: any) {
        let columns: ColumnMetadata[];
        if (relation.isManyToOne || relation.isOneToOneOwner) {
            columns = relation.entityMetadata.primaryColumns.map(joinColumn => joinColumn);
        } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            columns = relation.inverseRelation!.joinColumns.map(joinColumn => joinColumn);
        } else {
            if (relation.isOwning) {
                columns = relation.joinColumns.map(joinColumn => joinColumn);
            } else {
                columns = relation.inverseRelation!.inverseJoinColumns.map(joinColumn => joinColumn);
            }
        }
        return columns.reduce((data, column) => {
            data[column.databaseName] = relationIdRawResult[column.databaseName];
            return data;
        }, {} as ObjectLiteral);
    }

    /*private removeVirtualColumns(entity: ObjectLiteral, alias: Alias) {
        const virtualColumns = this.expressionMap.selects
            .filter(select => select.virtual)
            .map(select => select.selection.replace(alias.name + ".", ""));

        virtualColumns.forEach(virtualColumn => delete entity[virtualColumn]);
    }*/

}