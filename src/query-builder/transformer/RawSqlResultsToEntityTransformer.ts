import { Driver } from "../../driver/Driver"
import { RelationIdLoadResult } from "../relation-id/RelationIdLoadResult"
import { ObjectLiteral } from "../../common/ObjectLiteral"
import { ColumnMetadata } from "../../metadata/ColumnMetadata"
import { Alias } from "../Alias"
import { RelationCountLoadResult } from "../relation-count/RelationCountLoadResult"
import { RelationMetadata } from "../../metadata/RelationMetadata"
import { OrmUtils } from "../../util/OrmUtils"
import { QueryExpressionMap } from "../QueryExpressionMap"
import { EntityMetadata } from "../../metadata/EntityMetadata"
import { QueryRunner } from "../.."
import { DriverUtils } from "../../driver/DriverUtils"
import { ObjectUtils } from "../../util/ObjectUtils"

/**
 * Transforms raw sql results returned from the database into entity object.
 * Entity is constructed based on its entity metadata.
 */
export class RawSqlResultsToEntityTransformer {
    /**
     * Contains a hashmap for every rawRelationIdResults given.
     * In the hashmap you will find the idMaps of a result under the hash of this.hashEntityIds for the result.
     */
    private relationIdMaps: Array<{ [idHash: string]: any[] }>

    private pojo: boolean
    private selections: Set<string>
    private aliasCache: Map<string, Map<string, string>>
    private columnsCache: Map<
        string,
        Map<EntityMetadata, [string, ColumnMetadata][]>
    >

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        protected expressionMap: QueryExpressionMap,
        protected driver: Driver,
        protected rawRelationIdResults: RelationIdLoadResult[],
        protected rawRelationCountResults: RelationCountLoadResult[],
        protected queryRunner?: QueryRunner,
    ) {
        this.pojo = this.expressionMap.options.includes("create-pojo")
        this.selections = new Set(
            this.expressionMap.selects.map((s) => s.selection),
        )
        this.aliasCache = new Map()
        this.columnsCache = new Map()
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Since db returns a duplicated rows of the data where accuracies of the same object can be duplicated
     * we need to group our result and we must have some unique id (primary key in our case)
     * @param rawResults
     * @param alias
     */
    transform(rawResults: any[], alias: Alias): any[] {
        const group = this.group(rawResults, alias)
        const entities: any[] = []
        for (const results of group.values()) {
            const entity = this.transformRawResultsGroup(results, alias)
            if (entity !== undefined) entities.push(entity)
        }
        return entities
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Build an alias from a name and column name.
     * @param aliasName
     * @param columnName
     */
    protected buildAlias(aliasName: string, columnName: string) {
        let aliases = this.aliasCache.get(aliasName)
        if (!aliases) {
            aliases = new Map()
            this.aliasCache.set(aliasName, aliases)
        }
        let columnAlias = aliases.get(columnName)
        if (!columnAlias) {
            columnAlias = DriverUtils.buildAlias(
                this.driver,
                undefined,
                aliasName,
                columnName,
            )
            aliases.set(columnName, columnAlias)
        }
        return columnAlias
    }

    /**
     * Groups given raw results by ids of given alias.
     * @param rawResults
     * @param alias
     */
    protected group(rawResults: any[], alias: Alias): Map<string, any[]> {
        const map = new Map()
        const keys: string[] = []
        if (alias.metadata.tableType === "view") {
            keys.push(
                ...alias.metadata.columns.map((column) =>
                    this.buildAlias(alias.name, column.databaseName),
                ),
            )
        } else {
            keys.push(
                ...alias.metadata.primaryColumns.map((column) =>
                    this.buildAlias(alias.name, column.databaseName),
                ),
            )
        }

        // Check if primary key columns are actually selected in the raw results
        const primaryKeysSelected = keys.some(
            (key) => key in (rawResults[0] ?? {}),
        )

        for (const rawResult of rawResults) {
            let id: string

            if (primaryKeysSelected) {
                // Use primary key based grouping when available
                id = keys
                    .map((key) => {
                        const keyValue = rawResult[key]

                        if (Buffer.isBuffer(keyValue)) {
                            return keyValue.toString("hex")
                        }

                        if (ObjectUtils.isObject(keyValue)) {
                            return JSON.stringify(keyValue)
                        }

                        return keyValue
                    })
                    .join("_")
            } else {
                // Fallback: use row index when primary keys are not available
                // This ensures each row gets its own group for proper entity mapping
                const rowIndex = rawResults.indexOf(rawResult)
                id = `row_${rowIndex}`
            }

            const items = map.get(id)
            if (!items) {
                map.set(id, [rawResult])
            } else {
                items.push(rawResult)
            }
        }
        return map
    }

    /**
     * Transforms set of data results into single entity.
     * @param rawResults
     * @param alias
     */
    protected transformRawResultsGroup(
        rawResults: any[],
        alias: Alias,
    ): ObjectLiteral | undefined {
        // let hasColumns = false; // , hasEmbeddedColumns = false, hasParentColumns = false, hasParentEmbeddedColumns = false;
        let metadata = alias.metadata

        if (metadata.discriminatorColumn) {
            const discriminatorValues = rawResults.map(
                (result) =>
                    result[
                        this.buildAlias(
                            alias.name,
                            alias.metadata.discriminatorColumn!.databaseName,
                        )
                    ],
            )
            const discriminatorMetadata = metadata.childEntityMetadatas.find(
                (childEntityMetadata) => {
                    return (
                        typeof discriminatorValues.find(
                            (value) =>
                                value ===
                                childEntityMetadata.discriminatorValue,
                        ) !== "undefined"
                    )
                },
            )
            if (discriminatorMetadata) metadata = discriminatorMetadata
        }
        const entity: any = metadata.create(this.queryRunner, {
            fromDeserializer: true,
            pojo: this.pojo,
        })

        // get value from columns selections and put them into newly created entity
        const hasColumns = this.transformColumns(
            rawResults,
            alias,
            entity,
            metadata,
        )
        const hasRelations = this.transformJoins(
            rawResults,
            entity,
            alias,
            metadata,
        )
        const hasRelationIds = this.transformRelationIds(
            rawResults,
            alias,
            entity,
            metadata,
        )
        const hasRelationCounts = this.transformRelationCounts(
            rawResults,
            alias,
            entity,
        )

        // if we have at least one selected column then return this entity
        // since entity must have at least primary columns to be really selected and transformed into entity
        if (hasColumns) return entity

        // if we don't have any selected column we should not return entity,
        // except for the case when entity only contain a primary column as a relation to another entity
        // in this case its absolutely possible our entity to not have any columns except a single relation
        const hasOnlyVirtualPrimaryColumns = metadata.primaryColumns.every(
            (column) => column.isVirtual === true,
        ) // todo: create metadata.hasOnlyVirtualPrimaryColumns
        if (
            hasOnlyVirtualPrimaryColumns &&
            (hasRelations || hasRelationIds || hasRelationCounts)
        )
            return entity

        return undefined
    }

    // get value from columns selections and put them into object
    protected transformColumns(
        rawResults: any[],
        alias: Alias,
        entity: ObjectLiteral,
        metadata: EntityMetadata,
    ): boolean {
        let hasData = false
        const result = rawResults[0]
        for (const [key, column] of this.getColumnsToProcess(
            alias.name,
            metadata,
        )) {
            const value = result[key]

            if (value === undefined) continue
            // we don't mark it as has data because if we will have all nulls in our object - we don't need such object
            else if (value !== null && !column.isVirtualProperty) hasData = true

            column.setEntityValue(
                entity,
                this.driver.prepareHydratedValue(value, column),
            )
        }
        return hasData
    }

    /**
     * Transforms joined entities in the given raw results by a given alias and stores to the given (parent) entity
     * @param rawResults
     * @param entity
     * @param alias
     * @param metadata
     */
    protected transformJoins(
        rawResults: any[],
        entity: ObjectLiteral,
        alias: Alias,
        metadata: EntityMetadata,
    ) {
        let hasData = false

        // let discriminatorValue: string = "";
        // if (metadata.discriminatorColumn)
        //     discriminatorValue = rawResults[0][this.buildAlias(alias.name, alias.metadata.discriminatorColumn!.databaseName)];

        for (const join of this.expressionMap.joinAttributes) {
            // todo: we have problem here - when inner joins are used without selects it still create empty array

            // skip joins without metadata
            if (!join.metadata) continue

            // if simple left or inner join was performed without selection then we don't need to do anything
            if (!join.isSelected) continue

            // this check need to avoid setting properties than not belong to entity when single table inheritance used. (todo: check if we still need it)
            // const metadata = metadata.childEntityMetadatas.find(childEntityMetadata => discriminatorValue === childEntityMetadata.discriminatorValue);
            if (
                join.relation &&
                !metadata.relations.find(
                    (relation) => relation === join.relation,
                )
            )
                continue

            // some checks to make sure this join is for current alias
            if (join.mapToProperty) {
                if (join.mapToPropertyParentAlias !== alias.name) continue
            } else {
                if (
                    !join.relation ||
                    join.parentAlias !== alias.name ||
                    join.relationPropertyPath !== join.relation!.propertyPath
                )
                    continue
            }

            // transform joined data into entities
            let result: any = this.transform(rawResults, join.alias)
            result = !join.isMany ? result[0] : result
            result = !join.isMany && result === undefined ? null : result // this is needed to make relations to return null when its joined but nothing was found in the database
            // if nothing was joined then simply continue
            if (result === undefined) continue

            // if join was mapped to some property then save result to that property
            if (join.mapToPropertyPropertyName) {
                entity[join.mapToPropertyPropertyName] = result // todo: fix embeds
            } else {
                // otherwise set to relation
                join.relation!.setEntityValue(entity, result)
            }

            hasData = true
        }
        return hasData
    }

    protected transformRelationIds(
        rawSqlResults: any[],
        alias: Alias,
        entity: ObjectLiteral,
        metadata: EntityMetadata,
    ): boolean {
        let hasData = false
        for (const [
            index,
            rawRelationIdResult,
        ] of this.rawRelationIdResults.entries()) {
            if (
                rawRelationIdResult.relationIdAttribute.parentAlias !==
                alias.name
            )
                continue

            const relation = rawRelationIdResult.relationIdAttribute.relation
            const valueMap = this.createValueMapFromJoinColumns(
                relation,
                rawRelationIdResult.relationIdAttribute.parentAlias,
                rawSqlResults,
            )
            if (valueMap === undefined || valueMap === null) {
                continue
            }

            // prepare common data for this call
            this.prepareDataForTransformRelationIds()

            // Extract idMaps from prepared data by hash
            const hash = this.hashEntityIds(relation, valueMap)
            const idMaps = this.relationIdMaps[index][hash] || []

            // Map data to properties
            const properties =
                rawRelationIdResult.relationIdAttribute.mapToPropertyPropertyPath.split(
                    ".",
                )
            const mapToProperty = (
                properties: string[],
                map: ObjectLiteral,
                value: any,
            ): any => {
                const property = properties.shift()
                if (property && properties.length === 0) {
                    map[property] = value
                    return map
                }
                if (property && properties.length > 0) {
                    if (
                        typeof map[property] !== "object" ||
                        map[property] === null
                    ) {
                        map[property] = {}
                    }
                    mapToProperty(properties, map[property], value)
                } else {
                    return map
                }
            }
            if (relation.isOneToOne || relation.isManyToOne) {
                if (idMaps[0] !== undefined) {
                    mapToProperty(properties, entity, idMaps[0])
                    hasData = true
                }
            } else {
                mapToProperty(properties, entity, idMaps)
                hasData = hasData || idMaps.length > 0
            }
        }

        return hasData
    }

    protected transformRelationCounts(
        rawSqlResults: any[],
        alias: Alias,
        entity: ObjectLiteral,
    ): boolean {
        let hasData = false
        for (const rawRelationCountResult of this.rawRelationCountResults) {
            if (
                rawRelationCountResult.relationCountAttribute.parentAlias !==
                alias.name
            )
                continue
            const relation =
                rawRelationCountResult.relationCountAttribute.relation
            let referenceColumnName: string

            if (relation.isOneToMany) {
                referenceColumnName =
                    relation.inverseRelation!.joinColumns[0].referencedColumn!
                        .databaseName // todo: fix joinColumns[0]
            } else {
                referenceColumnName = relation.isOwning
                    ? relation.joinColumns[0].referencedColumn!.databaseName
                    : relation.inverseRelation!.joinColumns[0].referencedColumn!
                          .databaseName
            }

            const referenceColumnValue =
                rawSqlResults[0][
                    this.buildAlias(alias.name, referenceColumnName)
                ] // we use zero index since its grouped data // todo: selection with alias for entity columns wont work
            if (
                referenceColumnValue !== undefined &&
                referenceColumnValue !== null
            ) {
                entity[
                    rawRelationCountResult.relationCountAttribute.mapToPropertyPropertyName
                ] = 0
                for (const result of rawRelationCountResult.results) {
                    if (result["parentId"] !== referenceColumnValue) continue
                    entity[
                        rawRelationCountResult.relationCountAttribute.mapToPropertyPropertyName
                    ] = parseInt(result["cnt"])
                    hasData = true
                }
            }
        }

        return hasData
    }

    private getColumnsToProcess(aliasName: string, metadata: EntityMetadata) {
        let metadatas = this.columnsCache.get(aliasName)
        if (!metadatas) {
            metadatas = new Map()
            this.columnsCache.set(aliasName, metadatas)
        }
        let columns = metadatas.get(metadata)
        if (!columns) {
            columns = metadata.columns
                .filter(
                    (column) =>
                        !column.isVirtual &&
                        // if user does not selected the whole entity or he used partial selection and does not select this particular column
                        // then we don't add this column and its value into the entity
                        (this.selections.has(aliasName) ||
                            this.selections.has(
                                `${aliasName}.${column.propertyPath}`,
                            )) &&
                        // if table inheritance is used make sure this column is not child's column
                        !metadata.childEntityMetadatas.some(
                            (childMetadata) =>
                                childMetadata.target === column.target,
                        ),
                )
                .map((column) => [
                    this.buildAlias(aliasName, column.databaseName),
                    column,
                ])
            metadatas.set(metadata, columns)
        }
        return columns
    }

    private createValueMapFromJoinColumns(
        relation: RelationMetadata,
        parentAlias: string,
        rawSqlResults: any[],
    ): ObjectLiteral {
        let columns: ColumnMetadata[]
        if (relation.isManyToOne || relation.isOneToOneOwner) {
            columns = relation.entityMetadata.primaryColumns.map(
                (joinColumn) => joinColumn,
            )
        } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            columns = relation.inverseRelation!.joinColumns.map(
                (joinColumn) => joinColumn,
            )
        } else {
            if (relation.isOwning) {
                columns = relation.joinColumns.map((joinColumn) => joinColumn)
            } else {
                columns = relation.inverseRelation!.inverseJoinColumns.map(
                    (joinColumn) => joinColumn,
                )
            }
        }
        return columns.reduce((valueMap, column) => {
            for (const rawSqlResult of rawSqlResults) {
                if (relation.isManyToOne || relation.isOneToOneOwner) {
                    valueMap[column.databaseName] =
                        this.driver.prepareHydratedValue(
                            rawSqlResult[
                                this.buildAlias(
                                    parentAlias,
                                    column.databaseName,
                                )
                            ],
                            column,
                        )
                } else {
                    valueMap[column.databaseName] =
                        this.driver.prepareHydratedValue(
                            rawSqlResult[
                                this.buildAlias(
                                    parentAlias,
                                    column.referencedColumn!.databaseName,
                                )
                            ],
                            column.referencedColumn!,
                        )
                }
            }
            return valueMap
        }, {} as ObjectLiteral)
    }

    private extractEntityPrimaryIds(
        relation: RelationMetadata,
        relationIdRawResult: any,
    ) {
        let columns: ColumnMetadata[]
        if (relation.isManyToOne || relation.isOneToOneOwner) {
            columns = relation.entityMetadata.primaryColumns.map(
                (joinColumn) => joinColumn,
            )
        } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            columns = relation.inverseRelation!.joinColumns.map(
                (joinColumn) => joinColumn,
            )
        } else {
            if (relation.isOwning) {
                columns = relation.joinColumns.map((joinColumn) => joinColumn)
            } else {
                columns = relation.inverseRelation!.inverseJoinColumns.map(
                    (joinColumn) => joinColumn,
                )
            }
        }
        return columns.reduce((data, column) => {
            data[column.databaseName] = relationIdRawResult[column.databaseName]
            return data
        }, {} as ObjectLiteral)
    }

    /*private removeVirtualColumns(entity: ObjectLiteral, alias: Alias) {
        const virtualColumns = this.expressionMap.selects
            .filter(select => select.virtual)
            .map(select => select.selection.replace(alias.name + ".", ""));

        virtualColumns.forEach(virtualColumn => delete entity[virtualColumn]);
    }*/

    /** Prepare data to run #transformRelationIds, as a lot of result independent data is needed in every call */
    private prepareDataForTransformRelationIds() {
        // Return early if the relationIdMaps were already calculated
        if (this.relationIdMaps) {
            return
        }

        // Ensure this prepare function is only called once
        this.relationIdMaps = this.rawRelationIdResults.map(
            (rawRelationIdResult) => {
                const relation =
                    rawRelationIdResult.relationIdAttribute.relation

                // Calculate column metadata
                let columns: ColumnMetadata[]
                if (relation.isManyToOne || relation.isOneToOneOwner) {
                    columns = relation.joinColumns
                } else if (
                    relation.isOneToMany ||
                    relation.isOneToOneNotOwner
                ) {
                    columns = relation.inverseEntityMetadata.primaryColumns
                } else {
                    // ManyToMany
                    if (relation.isOwning) {
                        columns = relation.inverseJoinColumns
                    } else {
                        columns = relation.inverseRelation!.joinColumns
                    }
                }

                // Calculate the idMaps for the rawRelationIdResult
                return rawRelationIdResult.results.reduce<{
                    [idHash: string]: any[]
                }>((agg, result) => {
                    let idMap = columns.reduce((idMap, column) => {
                        let value = result[column.databaseName]
                        if (
                            relation.isOneToMany ||
                            relation.isOneToOneNotOwner
                        ) {
                            if (
                                column.isVirtual &&
                                column.referencedColumn &&
                                column.referencedColumn.propertyName !==
                                    column.propertyName
                            ) {
                                // if column is a relation
                                value =
                                    column.referencedColumn.createValueMap(
                                        value,
                                    )
                            }

                            return OrmUtils.mergeDeep(
                                idMap,
                                column.createValueMap(value),
                            )
                        }
                        if (
                            !column.isPrimary &&
                            column.referencedColumn!.referencedColumn
                        ) {
                            // if column is a relation
                            value =
                                column.referencedColumn!.referencedColumn.createValueMap(
                                    value,
                                )
                        }

                        return OrmUtils.mergeDeep(
                            idMap,
                            column.referencedColumn!.createValueMap(value),
                        )
                    }, {} as ObjectLiteral)

                    if (
                        columns.length === 1 &&
                        !rawRelationIdResult.relationIdAttribute.disableMixedMap
                    ) {
                        if (
                            relation.isOneToMany ||
                            relation.isOneToOneNotOwner
                        ) {
                            idMap = columns[0].getEntityValue(idMap)
                        } else {
                            idMap =
                                columns[0].referencedColumn!.getEntityValue(
                                    idMap,
                                )
                        }
                    }

                    // If an idMap is found, set it in the aggregator under the correct hash
                    if (idMap !== undefined) {
                        const hash = this.hashEntityIds(relation, result)

                        if (agg[hash]) {
                            agg[hash].push(idMap)
                        } else {
                            agg[hash] = [idMap]
                        }
                    }

                    return agg
                }, {})
            },
        )
    }

    /**
     * Use a simple JSON.stringify to create a simple hash of the primary ids of an entity.
     * As this.extractEntityPrimaryIds always creates the primary id object in the same order, if the same relation is
     * given, a simple JSON.stringify should be enough to get a unique hash per entity!
     * @param relation
     * @param data
     */
    private hashEntityIds(relation: RelationMetadata, data: ObjectLiteral) {
        const entityPrimaryIds = this.extractEntityPrimaryIds(relation, data)
        return JSON.stringify(entityPrimaryIds)
    }
}
