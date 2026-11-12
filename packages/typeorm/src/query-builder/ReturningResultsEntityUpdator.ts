import type { ObjectLiteral } from "../common/ObjectLiteral"
import type { QueryRunner } from "../query-runner/QueryRunner"
import type { QueryExpressionMap } from "./QueryExpressionMap"
import type { ColumnMetadata } from "../metadata/ColumnMetadata"
import type { UpdateResult } from "./result/UpdateResult"
import type { InsertResult } from "./result/InsertResult"
import { TypeORMError } from "../error"
import { OrmUtils } from "../util/OrmUtils"
import { ApplyValueTransformers } from "../util/ApplyValueTransformers"

/**
 * Updates entity with returning results in the entity insert and update operations.
 */
export class ReturningResultsEntityUpdator {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        protected queryRunner: QueryRunner,
        protected expressionMap: QueryExpressionMap,
    ) {}

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Updates entities with a special columns after updation query execution.
     *
     * @param updateResult
     * @param entities
     */
    async update(
        updateResult: UpdateResult,
        entities: ObjectLiteral[],
    ): Promise<void> {
        const metadata = this.expressionMap.mainAlias!.metadata

        await Promise.all(
            entities.map(async (entity, entityIndex) => {
                // if database supports returning/output statement then we already should have updating values in the raw data returned by insert query
                if (
                    this.queryRunner.dataSource.driver.isReturningSqlSupported(
                        "update",
                    )
                ) {
                    if (
                        this.queryRunner.dataSource.driver.options.type ===
                            "oracle" &&
                        Array.isArray(updateResult.raw) &&
                        this.expressionMap.extraReturningColumns.length > 0
                    ) {
                        updateResult.raw = updateResult.raw.reduce(
                            (newRaw, rawItem, rawItemIndex) => {
                                newRaw[
                                    this.expressionMap.extraReturningColumns[
                                        rawItemIndex
                                    ].databaseName
                                ] = rawItem[0]
                                return newRaw
                            },
                            {} as ObjectLiteral,
                        )
                    }
                    const result = Array.isArray(updateResult.raw)
                        ? updateResult.raw[entityIndex]
                        : updateResult.raw
                    const returningColumns =
                        this.queryRunner.dataSource.driver.createGeneratedMap(
                            metadata,
                            result,
                        )
                    if (returningColumns) {
                        this.queryRunner.manager.merge(
                            metadata.target as any,
                            entity,
                            returningColumns,
                        )
                        updateResult.generatedMaps.push(returningColumns)
                    }
                } else {
                    // for driver which do not support returning/output statement we need to perform separate query and load what we need
                    const updationColumns =
                        this.expressionMap.extraReturningColumns
                    if (updationColumns.length > 0) {
                        // get entity id by which we will get needed data
                        const entityId =
                            this.expressionMap.mainAlias!.metadata.getEntityIdMap(
                                entity,
                            )
                        if (!entityId)
                            throw new TypeORMError(
                                `Cannot update entity because entity id is not set in the entity.`,
                            )

                        // execute query to get needed data
                        const loadedReturningColumns =
                            (await this.queryRunner.manager
                                .createQueryBuilder()
                                .select(
                                    metadata.primaryColumns.map(
                                        (column) =>
                                            metadata.targetName +
                                            "." +
                                            column.propertyPath,
                                    ),
                                )
                                .addSelect(
                                    updationColumns.map(
                                        (column) =>
                                            metadata.targetName +
                                            "." +
                                            column.propertyPath,
                                    ),
                                )
                                .from(metadata.target, metadata.targetName)
                                .where(entityId)
                                .withDeleted()
                                .setOption("create-pojo") // use POJO because created object can contain default values, e.g. property = null and those properties might be overridden by merge process
                                .getOne()) as any

                        if (loadedReturningColumns) {
                            this.queryRunner.manager.merge(
                                metadata.target as any,
                                entity,
                                loadedReturningColumns,
                            )
                            updateResult.generatedMaps.push(
                                loadedReturningColumns,
                            )
                        }
                    }
                }
            }),
        )
    }

    /**
     * Updates entities with a special columns after insertion query execution.
     *
     * @param insertResult
     * @param entities
     */
    async insert(
        insertResult: InsertResult,
        entities: ObjectLiteral[],
    ): Promise<void> {
        const metadata = this.expressionMap.mainAlias!.metadata
        let insertionColumns = metadata.getInsertionReturningColumns()

        // to prevent extra select SQL execution for databases not supporting RETURNING
        // in the case if we have generated column and it's value returned by underlying driver
        // we remove this column from the insertionColumns list
        const needToCheckGenerated =
            this.queryRunner.dataSource.driver.isReturningSqlSupported("insert")
        insertionColumns = insertionColumns.filter((column) => {
            if (!column.isGenerated) return true
            return needToCheckGenerated === true
        })

        if (
            Array.isArray(insertResult.raw) &&
            this.expressionMap.extraReturningColumns.length > 0
        ) {
            if (this.queryRunner.dataSource.driver.options.type === "oracle") {
                insertResult.raw = insertResult.raw.reduce(
                    (newRaw, rawItem, rawItemIndex) => {
                        newRaw[
                            this.expressionMap.extraReturningColumns[
                                rawItemIndex
                            ].databaseName
                        ] = rawItem[0]
                        return newRaw
                    },
                    {} as ObjectLiteral,
                )
            } else if (
                this.queryRunner.dataSource.driver.options.type === "spanner"
            ) {
                insertResult.raw = insertResult.raw[0]
            }
        }

        const isMatchingRequired =
            this.queryRunner.dataSource.driver.isReturningSqlSupported(
                "insert",
            ) &&
            Array.isArray(insertResult.raw) &&
            insertResult.raw.length < entities.length

        const matchedRaw: (ObjectLiteral | undefined)[] = []
        if (isMatchingRequired) {
            const usedRawIndices = new Set<number>()

            // Build signature index for O(1) candidate lookup on bulk collections
            const identifyingColumns = (
                this.expressionMap.extraReturningColumns.length > 0
                    ? this.expressionMap.extraReturningColumns
                    : metadata.columns
            ).filter(
                (c) =>
                    !c.isGenerated &&
                    !c.isCreateDate &&
                    !c.isUpdateDate &&
                    !c.isDeleteDate &&
                    !c.isVersion,
            )

            const signatureToRawIndices = new Map<string, number[]>()
            for (let r = 0; r < insertResult.raw.length; r++) {
                const rawItem = insertResult.raw[r]
                const sig = this.getEntityMatchingSignature(
                    rawItem,
                    identifyingColumns,
                    true,
                )
                if (sig !== undefined) {
                    let list = signatureToRawIndices.get(sig)
                    if (!list) {
                        list = []
                        signatureToRawIndices.set(sig, list)
                    }
                    list.push(r)
                }
            }

            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i]
                let foundMatch: ObjectLiteral | undefined = undefined

                // Fast O(1) candidate lookup by identifying signature
                const entitySig = this.getEntityMatchingSignature(
                    entity,
                    identifyingColumns,
                    false,
                )
                if (
                    entitySig !== undefined &&
                    signatureToRawIndices.has(entitySig)
                ) {
                    const candidates = signatureToRawIndices.get(entitySig)!
                    for (let c = 0; c < candidates.length; c++) {
                        const candidateIndex = candidates[c]
                        if (!usedRawIndices.has(candidateIndex)) {
                            const candidateRaw =
                                insertResult.raw[candidateIndex]
                            if (this.doesEntityMatchRaw(entity, candidateRaw)) {
                                usedRawIndices.add(candidateIndex)
                                foundMatch = candidateRaw
                                break
                            }
                        }
                    }
                }

                // Fallback to sequential match if no signature match was found
                if (!foundMatch) {
                    for (let r = 0; r < insertResult.raw.length; r++) {
                        if (usedRawIndices.has(r)) continue
                        const rawItem = insertResult.raw[r]
                        if (this.doesEntityMatchRaw(entity, rawItem)) {
                            foundMatch = rawItem
                            usedRawIndices.add(r)
                            break
                        }
                    }
                }
                matchedRaw.push(foundMatch)
            }
        }

        const generatedMaps = entities.map((entity, entityIndex) => {
            // get all values generated by a database for us
            const result = isMatchingRequired
                ? matchedRaw[entityIndex]
                : Array.isArray(insertResult.raw)
                  ? insertResult.raw[entityIndex]
                  : insertResult.raw

            if (isMatchingRequired && result === undefined) {
                return undefined
            }

            const generatedMap =
                this.queryRunner.dataSource.driver.createGeneratedMap(
                    metadata,
                    result,
                    entityIndex,
                    entities.length,
                ) ?? {}

            if (entityIndex in this.expressionMap.locallyGenerated) {
                this.queryRunner.manager.merge(
                    metadata.target as any,
                    generatedMap,
                    this.expressionMap.locallyGenerated[entityIndex],
                )
            }

            this.queryRunner.manager.merge(
                metadata.target as any,
                entity,
                generatedMap,
            )

            return generatedMap
        })

        // for postgres and mssql we use returning/output statement to get values of inserted default and generated values
        // for other drivers we have to re-select this data from the database
        if (
            insertionColumns.length > 0 &&
            !this.queryRunner.dataSource.driver.isReturningSqlSupported(
                "insert",
            )
        ) {
            const entityIds = entities.map((entity) => {
                const entityId = metadata.getEntityIdMap(entity)!

                // We have to check for an empty `entityId` - if we don't, the query against the database
                // effectively drops the `where` clause entirely and the first record will be returned -
                // not what we want at all.
                if (!entityId)
                    throw new TypeORMError(
                        `Cannot update entity because entity id is not set in the entity.`,
                    )

                return entityId
            })

            // to select just inserted entities we need a criteria to select by.
            // for newly inserted entities in drivers which do not support returning statement
            // row identifier can only be an increment column
            // (since its the only thing that can be generated by those databases)
            // or (and) other primary key which is defined by a user and inserted value has it

            const returningResult: any = await this.queryRunner.manager
                .createQueryBuilder()
                .select(
                    metadata.primaryColumns.map(
                        (column) =>
                            metadata.targetName + "." + column.propertyPath,
                    ),
                )
                .addSelect(
                    insertionColumns.map(
                        (column) =>
                            metadata.targetName + "." + column.propertyPath,
                    ),
                )
                .from(metadata.target, metadata.targetName)
                .where(entityIds)
                .setOption("create-pojo") // use POJO because created object can contain default values, e.g. property = null and those properties might be overridden by merge process
                .getMany()

            entities.forEach((entity, entityIndex) => {
                this.queryRunner.manager.merge(
                    metadata.target as any,
                    generatedMaps[entityIndex],
                    returningResult[entityIndex],
                )

                this.queryRunner.manager.merge(
                    metadata.target as any,
                    entity,
                    returningResult[entityIndex],
                )
            })
        }

        entities.forEach((entity, entityIndex) => {
            const wasInserted =
                !isMatchingRequired || matchedRaw[entityIndex] !== undefined
            const entityId = wasInserted
                ? metadata.getEntityIdMap(entity)
                : undefined
            insertResult.identifiers.push(entityId)
            insertResult.generatedMaps.push(generatedMaps[entityIndex])
        })
    }

    /**
     * Normalizes a column value for signature indexing and cross-driver matching.
     *
     * @param entityOrRaw Entity or raw row object to read from.
     * @param col Target column metadata.
     * @param isRaw Whether `entityOrRaw` is a database raw row rather than an entity.
     * @returns Encoded value string or `undefined` if missing or non-deterministic.
     */
    protected normalizeColumnSignaturePart(
        entityOrRaw: ObjectLiteral,
        col: ColumnMetadata,
        isRaw: boolean,
    ): string | undefined {
        const driver = this.queryRunner.dataSource.driver
        let val: unknown
        if (isRaw) {
            if (!(col.databaseName in entityOrRaw)) {
                return undefined
            }
            val = entityOrRaw[col.databaseName]
            if (val === undefined) {
                return undefined
            }
            if (val !== null && !col.transformer) {
                val = driver.preparePersistentValue(
                    driver.prepareHydratedValue(val, col),
                    col,
                )
            }
        } else {
            const rawEntityVal = col.getEntityValue(entityOrRaw)
            if (
                rawEntityVal === undefined ||
                typeof rawEntityVal === "function"
            ) {
                return undefined
            }
            val = driver.preparePersistentValue(rawEntityVal, col)
        }
        if (val === undefined || typeof val === "function") {
            return undefined
        }
        if (val === null) {
            return "n:null"
        }
        if (val instanceof Date) {
            const iso = Number.isNaN(val.getTime())
                ? String(val)
                : val.toISOString()
            return `d:${iso.length}:${iso}`
        }
        if (typeof val === "object") {
            return undefined
        }
        const valStr = String(val)
        return `v:${valStr.length}:${valStr}`
    }

    /**
     * Computes a deterministic string signature from identifying columns
     * for O(1) indexed correlation during bulk inserts.
     *
     * @param entityOrRaw Entity or raw row object to extract signature values from.
     * @param columns Identifying column metadata used to compose the signature.
     * @param isRaw Whether `entityOrRaw` is a database raw row rather than an entity.
     * @returns Delimiter-safe signature string, or `undefined` if any identifying value is missing or non-deterministic.
     */
    protected getEntityMatchingSignature(
        entityOrRaw: ObjectLiteral,
        columns: ColumnMetadata[],
        isRaw: boolean,
    ): string | undefined {
        const parts: string[] = []
        for (const col of columns) {
            const encoded = this.normalizeColumnSignaturePart(
                entityOrRaw,
                col,
                isRaw,
            )
            if (encoded === undefined) {
                return undefined
            }
            const colName = col.databaseName
            parts.push(`${colName.length}:${colName}=${encoded}`)
        }
        return parts.length > 0 ? parts.join(";") : undefined
    }

    /**
     * Compares an entity's supplied column value against a returned raw value,
     * normalizing persistent/hydrated formats (such as Date strings and transformers)
     * and keeping explicit `null` distinct from unset (`undefined`).
     *
     * @param column Column metadata for the field being compared.
     * @param entityValue Value read from the input entity (`!== undefined`, non-function).
     * @param rawValue Value returned in the raw database row.
     * @returns `true` if the column values represent the same stored value.
     */
    protected doesColumnValueMatch(
        column: ColumnMetadata,
        entityValue: unknown,
        rawValue: unknown,
    ): boolean {
        if (rawValue === undefined) {
            return false
        }
        const driver = this.queryRunner.dataSource.driver
        const hydratedRawValue = driver.prepareHydratedValue(rawValue, column)
        const persistentEntityValue = driver.preparePersistentValue(
            entityValue,
            column,
        )

        if (entityValue === null) {
            if (rawValue === null || hydratedRawValue === null) {
                return true
            }
            return (
                column.transformer !== undefined &&
                (OrmUtils.deepCompare(persistentEntityValue, rawValue) ||
                    (persistentEntityValue !== null &&
                        persistentEntityValue !== undefined &&
                        persistentEntityValue == rawValue))
            )
        }

        let isMatch =
            OrmUtils.deepCompare(entityValue, hydratedRawValue) ||
            (rawValue !== null && entityValue == rawValue) ||
            OrmUtils.deepCompare(persistentEntityValue, hydratedRawValue) ||
            OrmUtils.deepCompare(persistentEntityValue, rawValue)

        if (!isMatch && !column.transformer) {
            const persistentRawValue = driver.preparePersistentValue(
                hydratedRawValue,
                column,
            )
            isMatch = OrmUtils.deepCompare(
                persistentEntityValue,
                persistentRawValue,
            )
        }

        if (!isMatch && column.transformer) {
            const transformed = ApplyValueTransformers.transformTo(
                column.transformer,
                entityValue,
            )
            const hydratedFromRaw = ApplyValueTransformers.transformFrom(
                column.transformer,
                hydratedRawValue,
            )
            isMatch =
                OrmUtils.deepCompare(transformed, rawValue) ||
                (transformed != null &&
                    rawValue != null &&
                    transformed == rawValue) ||
                OrmUtils.deepCompare(transformed, hydratedRawValue) ||
                OrmUtils.deepCompare(entityValue, hydratedFromRaw) ||
                (hydratedFromRaw != null && entityValue == hydratedFromRaw)
        }
        return isMatch
    }

    /**
     * Checks if a raw row returned from the database matches an entity.
     * Used when rows can be skipped (e.g. insert on conflict / orIgnore).
     * Handles composite keys, transformers, explicit nulls, timestamps, functions, and default-only entities.
     *
     * @param entity Input entity or value set.
     * @param rawItem Raw row returned from the database.
     * @returns `true` if the raw row corresponds to `entity`.
     */
    protected doesEntityMatchRaw(
        entity: ObjectLiteral,
        rawItem: ObjectLiteral,
    ): boolean {
        const metadata = this.expressionMap.mainAlias!.metadata

        // 1. Primary key check
        let allPrimaryKeysDefined = metadata.primaryColumns.length > 0
        let hasMismatchedPrimaryKey = false
        let hasDefinedPrimaryKey = false
        for (const primaryColumn of metadata.primaryColumns) {
            const entityValue = primaryColumn.getEntityValue(entity)
            if (entityValue !== undefined && entityValue !== null) {
                if (typeof entityValue === "function") {
                    allPrimaryKeysDefined = false
                    continue
                }
                hasDefinedPrimaryKey = true
                const rawValue = rawItem[primaryColumn.databaseName]
                if (
                    !this.doesColumnValueMatch(
                        primaryColumn,
                        entityValue,
                        rawValue,
                    )
                ) {
                    hasMismatchedPrimaryKey = true
                    break
                }
            } else {
                allPrimaryKeysDefined = false
            }
        }

        if (hasMismatchedPrimaryKey) {
            return false
        }
        if (allPrimaryKeysDefined) {
            return true
        }

        // 2. Non-generated / inserted column check
        let hasMismatch = false
        let matchedColumnsCount = 0
        let hasComparableColumnValue = false

        for (const column of metadata.columns) {
            if (
                column.isGenerated ||
                column.isCreateDate ||
                column.isUpdateDate ||
                column.isDeleteDate ||
                column.isVersion
            ) {
                continue
            }

            const entityValue = column.getEntityValue(entity)
            if (
                entityValue !== undefined &&
                typeof entityValue !== "function"
            ) {
                hasComparableColumnValue = true
                if (column.databaseName in rawItem) {
                    const rawValue = rawItem[column.databaseName]
                    if (
                        !this.doesColumnValueMatch(
                            column,
                            entityValue,
                            rawValue,
                        )
                    ) {
                        hasMismatch = true
                        break
                    }
                    matchedColumnsCount++
                }
            }
        }

        if (hasMismatch) {
            return false
        }

        if (matchedColumnsCount > 0 || hasDefinedPrimaryKey) {
            return true
        }

        // Only default-only entities (no comparable non-generated values) may claim an unverified row
        return !hasComparableColumnValue
    }

    getUpdationReturningColumns(): ColumnMetadata[] {
        return this.expressionMap.mainAlias!.metadata.columns.filter(
            (column) => {
                return (
                    column.asExpression !== undefined ||
                    column.isUpdateDate ||
                    column.isVersion
                )
            },
        )
    }

    /**
     * Columns we need to be returned from the database when we soft delete and restore entity.
     */
    getSoftDeletionReturningColumns(): ColumnMetadata[] {
        return this.expressionMap.mainAlias!.metadata.columns.filter(
            (column) => {
                return (
                    column.asExpression !== undefined ||
                    column.isUpdateDate ||
                    column.isVersion ||
                    column.isDeleteDate
                )
            },
        )
    }
}
