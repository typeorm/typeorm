import type { ObjectLiteral } from "../../common/ObjectLiteral"
import type { Driver } from "../../driver/Driver"
import { DriverUtils } from "../../driver/DriverUtils"
import type { ColumnMetadata } from "../../metadata/ColumnMetadata"
import type { EntityMetadata } from "../../metadata/EntityMetadata"
import type { RelationMetadata } from "../../metadata/RelationMetadata"
import type { QueryRunner } from "../../query-runner/QueryRunner"
import { ObjectUtils } from "../../util/ObjectUtils"
import { isUint8Array, uint8ArrayToHex } from "../../util/Uint8ArrayUtils"
import { OrmUtils } from "../../util/OrmUtils"
import type { Alias } from "../Alias"
import type { QueryExpressionMap } from "../QueryExpressionMap"
import type { RelationIdLoadResult } from "../relation-id/RelationIdLoadResult"

/**
 * A join attribute reduced to the data needed while hydrating entities.
 * Resolving a JoinAttribute is expensive (its parentAlias, relationPropertyPath and
 * mapToProperty* members are getters that re-parse strings on every access), so the
 * joins applicable to an alias are resolved once and reused for every entity.
 */
interface JoinToProcess {
    alias: Alias
    isMany: boolean
    mapToPropertyPropertyName: string | undefined
    relation: RelationMetadata | undefined
}

/**
 * A relation id attribute reduced to the data needed while hydrating entities.
 */
interface RelationIdToProcess {
    /**
     * Index of the corresponding entry in rawRelationIdResults / relationIdMaps.
     */
    index: number
    relation: RelationMetadata
    /**
     * mapToPropertyPropertyPath split into its segments.
     */
    properties: string[]
    /**
     * Columns of the value map, along with the raw result key to read and the
     * column metadata to hydrate the raw value with.
     */
    valueMapColumns: Array<{
        databaseName: string
        rawKey: string
        hydrateWith: ColumnMetadata
    }>
}

/**
 * Everything needed to hydrate an entity of one alias, resolved once up front.
 *
 * None of it depends on the raw results, while hydration runs it once per row group,
 * so resolving it per alias/metadata pair instead keeps the per-entity work down to
 * reading already-prepared arrays.
 */
interface HydrationPlan {
    /**
     * Metadata the plan was built for. Differs from the alias metadata when single
     * table inheritance selected a child entity.
     */
    metadata: EntityMetadata
    /**
     * Columns to hydrate, paired with the raw result key holding their value.
     */
    columns: Array<{ key: string; column: ColumnMetadata }>
    joins: JoinToProcess[]
    relationIds: RelationIdToProcess[]
    /**
     * Raw result key of the discriminator column, if the entity uses one.
     */
    discriminatorKey: string | undefined
    hasOnlyVirtualPrimaryColumns: boolean
}

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
    private planCache: Map<string, Map<EntityMetadata, HydrationPlan>>
    private groupKeysCache: Map<string, string[]>
    private relationIdsCache: Map<string, RelationIdToProcess[]>
    private relationIdColumnsCache: Map<RelationMetadata, ColumnMetadata[]>

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        protected expressionMap: QueryExpressionMap,
        protected driver: Driver,
        protected rawRelationIdResults: RelationIdLoadResult[],
        protected queryRunner?: QueryRunner,
    ) {
        this.pojo = this.expressionMap.options.includes("create-pojo")
        this.selections = new Set(
            this.expressionMap.selects.map((s) => s.selection),
        )
        this.aliasCache = new Map()
        this.planCache = new Map()
        this.groupKeysCache = new Map()
        this.relationIdsCache = new Map()
        this.relationIdColumnsCache = new Map()
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Since db returns a duplicated rows of the data where accuracies of the same object can be duplicated
     * we need to group our result and we must have some unique id (primary key in our case)
     *
     * @param rawResults
     * @param alias
     */
    transform(rawResults: any[], alias: Alias): any[] {
        const group = this.group(rawResults, alias)
        const plan = this.getHydrationPlan(alias.name, alias.metadata)
        const entities: any[] = []
        for (const results of group.values()) {
            const entity = this.transformRawResultsGroup(results, alias, plan)
            if (entity !== undefined) entities.push(entity)
        }
        return entities
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Build an alias from a name and column name.
     *
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
     *
     * @param rawResults
     * @param alias
     */
    protected group(rawResults: any[], alias: Alias): Map<string, any[]> {
        const map = new Map<string, any[]>()
        const keys = this.getGroupKeys(alias)

        // Check if primary key columns are actually selected in the raw results
        const firstResult = rawResults[0] ?? {}
        let primaryKeysSelected = false
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] in firstResult) {
                primaryKeysSelected = true
                break
            }
        }

        // the single key case is by far the most common one, so it gets to skip
        // the per-row string building below
        const singleKey = keys.length === 1 ? keys[0] : undefined

        for (let rowIndex = 0; rowIndex < rawResults.length; rowIndex++) {
            const rawResult = rawResults[rowIndex]
            let id: string

            if (!primaryKeysSelected) {
                // Fallback: use row index when primary keys are not available
                // This ensures each row gets its own group for proper entity mapping
                id = `row_${rowIndex}`
            } else if (singleKey !== undefined) {
                // Use primary key based grouping when available
                id = this.groupKeyValueToString(rawResult[singleKey])
            } else {
                id = ""
                for (let i = 0; i < keys.length; i++) {
                    if (i !== 0) id += "_"
                    id += this.groupKeyValueToString(rawResult[keys[i]])
                }
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
     * Raw result keys of the columns a given alias is grouped by.
     * Constant for an alias, so it is computed once per alias instead of once per
     * group() call - group() runs once per parent entity for every joined alias.
     */
    private getGroupKeys(alias: Alias): string[] {
        let keys = this.groupKeysCache.get(alias.name)
        if (keys !== undefined) return keys

        const columns =
            alias.metadata.tableType === "view"
                ? alias.metadata.columns
                : alias.metadata.primaryColumns
        keys = new Array<string>(columns.length)
        for (let i = 0; i < columns.length; i++) {
            keys[i] = this.buildAlias(alias.name, columns[i].databaseName)
        }

        this.groupKeysCache.set(alias.name, keys)
        return keys
    }

    /**
     * Turns a single grouping key value into its string representation.
     * Mirrors what Array#join did before: null and undefined both collapse to "".
     */
    private groupKeyValueToString(keyValue: any): string {
        if (keyValue === null || keyValue === undefined) return ""

        if (isUint8Array(keyValue)) {
            return uint8ArrayToHex(keyValue)
        }

        if (ObjectUtils.isObject(keyValue)) {
            return JSON.stringify(keyValue)
        }

        return typeof keyValue === "string" ? keyValue : String(keyValue)
    }

    /**
     * Transforms set of data results into single entity.
     *
     * @param rawResults
     * @param alias
     */
    protected transformRawResultsGroup(
        rawResults: any[],
        alias: Alias,
        plan: HydrationPlan = this.getHydrationPlan(alias.name, alias.metadata),
    ): ObjectLiteral | undefined {
        // let hasColumns = false; // , hasEmbeddedColumns = false, hasParentColumns = false, hasParentEmbeddedColumns = false;
        if (plan.discriminatorKey !== undefined) {
            const childEntityMetadatas = plan.metadata.childEntityMetadatas
            search: for (let i = 0; i < childEntityMetadatas.length; i++) {
                const discriminatorValue =
                    childEntityMetadatas[i].discriminatorValue
                // an undefined discriminator value never matched before, since the
                // previous implementation could not tell "found undefined" from "not found"
                if (discriminatorValue === undefined) continue
                for (let j = 0; j < rawResults.length; j++) {
                    if (
                        rawResults[j][plan.discriminatorKey] ===
                        discriminatorValue
                    ) {
                        plan = this.getHydrationPlan(
                            alias.name,
                            childEntityMetadatas[i],
                        )
                        break search
                    }
                }
            }
        }

        const metadata = plan.metadata
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
            plan,
        )
        const hasRelations = this.transformJoins(
            rawResults,
            entity,
            alias,
            metadata,
            plan,
        )
        const hasRelationIds = this.transformRelationIds(
            rawResults,
            alias,
            entity,
            metadata,
            plan,
        )
        // if we have at least one selected column then return this entity
        // since entity must have at least primary columns to be really selected and transformed into entity
        if (hasColumns) return entity

        // if we don't have any selected column we should not return entity,
        // except for the case when entity only contain a primary column as a relation to another entity
        // in this case its absolutely possible our entity to not have any columns except a single relation
        if (
            plan.hasOnlyVirtualPrimaryColumns &&
            (hasRelations || hasRelationIds)
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
        plan: HydrationPlan = this.getHydrationPlan(alias.name, metadata),
    ): boolean {
        let hasData = false
        const result = rawResults[0]
        const columns = plan.columns
        for (let i = 0; i < columns.length; i++) {
            const entry = columns[i]
            const value = result[entry.key]

            if (value === undefined) continue

            const column = entry.column
            // we don't mark it as has data because if we will have all nulls in our object - we don't need such object
            if (value !== null && !column.isVirtualProperty) hasData = true

            column.setEntityValue(
                entity,
                this.driver.prepareHydratedValue(value, column),
            )
        }
        return hasData
    }

    /**
     * Transforms joined entities in the given raw results by a given alias and stores to the given (parent) entity
     *
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
        plan: HydrationPlan = this.getHydrationPlan(alias.name, metadata),
    ) {
        let hasData = false

        // let discriminatorValue: string = "";
        // if (metadata.discriminatorColumn)
        //     discriminatorValue = rawResults[0][this.buildAlias(alias.name, alias.metadata.discriminatorColumn!.databaseName)];

        const joins = plan.joins
        for (let i = 0; i < joins.length; i++) {
            const join = joins[i]

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

    /**
     * Everything needed to hydrate entities of the given alias and metadata.
     *
     * None of it depends on the raw results, so the (fairly expensive) resolution
     * happens once per alias/metadata pair rather than once per entity.
     */
    private getHydrationPlan(
        aliasName: string,
        metadata: EntityMetadata,
    ): HydrationPlan {
        let metadatas = this.planCache.get(aliasName)
        if (!metadatas) {
            metadatas = new Map()
            this.planCache.set(aliasName, metadatas)
        }
        const cached = metadatas.get(metadata)
        if (cached !== undefined) return cached

        const plan: HydrationPlan = {
            metadata,
            columns: this.buildColumnsToProcess(aliasName, metadata),
            joins: this.buildJoinsToProcess(aliasName, metadata),
            relationIds: this.getRelationIdsToProcess(aliasName),
            discriminatorKey: metadata.discriminatorColumn
                ? this.buildAlias(
                      aliasName,
                      metadata.discriminatorColumn.databaseName,
                  )
                : undefined,
            // todo: create metadata.hasOnlyVirtualPrimaryColumns
            hasOnlyVirtualPrimaryColumns: metadata.primaryColumns.every(
                (column) => column.isVirtual === true,
            ),
        }

        metadatas.set(metadata, plan)
        return plan
    }

    private buildJoinsToProcess(
        aliasName: string,
        metadata: EntityMetadata,
    ): JoinToProcess[] {
        const joins: JoinToProcess[] = []
        for (const join of this.expressionMap.joinAttributes) {
            // todo: we have problem here - when inner joins are used without selects it still create empty array

            // skip joins without metadata
            if (!join.metadata) continue

            // if simple left or inner join was performed without selection then we don't need to do anything
            if (!join.isSelected) continue

            const relation = join.relation

            // this check need to avoid setting properties than not belong to entity when single table inheritance used. (todo: check if we still need it)
            // const metadata = metadata.childEntityMetadatas.find(childEntityMetadata => discriminatorValue === childEntityMetadata.discriminatorValue);
            if (relation && !metadata.relations.includes(relation)) continue

            // some checks to make sure this join is for current alias
            if (join.mapToProperty) {
                if (join.mapToPropertyParentAlias !== aliasName) continue
            } else {
                if (
                    !relation ||
                    join.parentAlias !== aliasName ||
                    join.relationPropertyPath !== relation.propertyPath
                )
                    continue
            }

            joins.push({
                alias: join.alias,
                isMany: join.isMany,
                mapToPropertyPropertyName: join.mapToPropertyPropertyName,
                relation,
            })
        }

        return joins
    }

    protected transformRelationIds(
        rawSqlResults: any[],
        alias: Alias,
        entity: ObjectLiteral,
        metadata: EntityMetadata,
        plan: HydrationPlan = this.getHydrationPlan(alias.name, metadata),
    ): boolean {
        if (this.rawRelationIdResults.length === 0) return false

        let hasData = false
        const relationIds = plan.relationIds
        for (let i = 0; i < relationIds.length; i++) {
            const relationId = relationIds[i]
            const relation = relationId.relation
            const valueMap = this.createValueMapFromJoinColumns(
                relationId,
                rawSqlResults,
            )

            // prepare common data for this call
            this.prepareDataForTransformRelationIds()

            // Extract idMaps from prepared data by hash
            const hash = this.hashEntityIds(relation, valueMap)
            const idMaps = this.relationIdMaps[relationId.index][hash] || []

            // Map data to properties
            if (relation.isOneToOne || relation.isManyToOne) {
                if (idMaps[0] !== undefined) {
                    this.mapToProperty(relationId.properties, entity, idMaps[0])
                    hasData = true
                }
            } else {
                this.mapToProperty(relationId.properties, entity, idMaps)
                hasData = hasData || idMaps.length > 0
            }
        }

        return hasData
    }

    /**
     * Relation ids that must be hydrated into entities of the given alias, with all
     * of the per-relation data that does not depend on the raw results resolved once.
     */
    private getRelationIdsToProcess(aliasName: string): RelationIdToProcess[] {
        let relationIds = this.relationIdsCache.get(aliasName)
        if (relationIds !== undefined) return relationIds

        relationIds = []
        for (let index = 0; index < this.rawRelationIdResults.length; index++) {
            const attribute =
                this.rawRelationIdResults[index].relationIdAttribute
            if (attribute.parentAlias !== aliasName) continue

            const relation = attribute.relation
            const readsParentPrimaryKeys =
                relation.isManyToOne || relation.isOneToOneOwner

            relationIds.push({
                index,
                relation,
                properties: attribute.mapToPropertyPropertyPath.split("."),
                valueMapColumns: this.getRelationIdColumns(relation).map(
                    (column) => ({
                        databaseName: column.databaseName,
                        rawKey: this.buildAlias(
                            aliasName,
                            readsParentPrimaryKeys
                                ? column.databaseName
                                : column.referencedColumn!.databaseName,
                        ),
                        hydrateWith: readsParentPrimaryKeys
                            ? column
                            : column.referencedColumn!,
                    }),
                ),
            })
        }

        this.relationIdsCache.set(aliasName, relationIds)
        return relationIds
    }

    /**
     * Writes a value into a (possibly nested) property path of the given map.
     * Stops at the first empty path segment, like the recursive implementation did.
     */
    private mapToProperty(
        properties: string[],
        map: ObjectLiteral,
        value: any,
    ): void {
        let target = map
        for (let i = 0; i < properties.length; i++) {
            const property = properties[i]
            if (!property) return

            if (i === properties.length - 1) {
                target[property] = value
                return
            }

            if (
                typeof target[property] !== "object" ||
                target[property] === null
            ) {
                target[property] = {}
            }
            target = target[property]
        }
    }

    private buildColumnsToProcess(
        aliasName: string,
        metadata: EntityMetadata,
    ): Array<{ key: string; column: ColumnMetadata }> {
        const aliasSelected = this.selections.has(aliasName)
        return metadata.columns
            .filter(
                (column) =>
                    !column.isVirtual &&
                    // if user does not selected the whole entity or he used partial selection and does not select this particular column
                    // then we don't add this column and its value into the entity
                    (aliasSelected ||
                        this.selections.has(
                            `${aliasName}.${column.propertyPath}`,
                        )) &&
                    // if table inheritance is used make sure this column is not child's column
                    !metadata.childEntityMetadatas.some(
                        (childMetadata) =>
                            childMetadata.target === column.target,
                    ),
            )
            .map((column) => ({
                key: this.buildAlias(aliasName, column.databaseName),
                column,
            }))
    }

    /**
     * Columns identifying the parent entity of a relation id result.
     * Both the value map and the entity id hash are built from these.
     */
    private getRelationIdColumns(relation: RelationMetadata): ColumnMetadata[] {
        let columns = this.relationIdColumnsCache.get(relation)
        if (columns !== undefined) return columns

        if (relation.isManyToOne || relation.isOneToOneOwner) {
            columns = relation.entityMetadata.primaryColumns
        } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            columns = relation.inverseRelation!.joinColumns
        } else {
            if (relation.isOwning) {
                columns = relation.joinColumns
            } else {
                columns = relation.inverseRelation!.inverseJoinColumns
            }
        }

        this.relationIdColumnsCache.set(relation, columns)
        return columns
    }

    private createValueMapFromJoinColumns(
        relationId: RelationIdToProcess,
        rawSqlResults: any[],
    ): ObjectLiteral {
        const valueMap: ObjectLiteral = {}
        // every raw result used to be written into the same value map keys in order,
        // which left the last one in place - so only the last one is read here
        if (rawSqlResults.length === 0) return valueMap

        const rawSqlResult = rawSqlResults[rawSqlResults.length - 1]
        const columns = relationId.valueMapColumns
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i]
            valueMap[column.databaseName] = this.driver.prepareHydratedValue(
                rawSqlResult[column.rawKey],
                column.hydrateWith,
            )
        }
        return valueMap
    }

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
     * As the primary id object is always created in the same column order, if the same
     * relation is given, a simple JSON.stringify should be enough to get a unique hash
     * per entity!
     *
     * @param relation
     * @param data
     */
    private hashEntityIds(relation: RelationMetadata, data: ObjectLiteral) {
        const columns = this.getRelationIdColumns(relation)
        const entityPrimaryIds: ObjectLiteral = {}
        for (let i = 0; i < columns.length; i++) {
            const databaseName = columns[i].databaseName
            entityPrimaryIds[databaseName] = data[databaseName]
        }
        return JSON.stringify(entityPrimaryIds)
    }
}
