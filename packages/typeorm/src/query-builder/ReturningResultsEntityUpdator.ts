import type { ObjectLiteral } from "../common/ObjectLiteral"
import type { QueryRunner } from "../query-runner/QueryRunner"
import type { QueryExpressionMap } from "./QueryExpressionMap"
import type { ColumnMetadata } from "../metadata/ColumnMetadata"
import type { EntityMetadata } from "../metadata/EntityMetadata"
import type { UpdateResult } from "./result/UpdateResult"
import type { InsertResult } from "./result/InsertResult"
import { TypeORMError } from "../error"

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

        // Normally the returned row at an entity's position belongs to that
        // entity, but a conflict clause (orIgnore / orUpdate) can skip rows, so
        // RETURNING comes back shorter and every later row would shift onto the
        // wrong entity. When that happens, match the rows back to entities by
        // their identifying (primary / unique) values instead of by position.
        const rawRowIndexes = this.mapReturnedRowsToEntitiesByConflictColumns(
            insertResult,
            entities,
            metadata,
        )

        const generatedMaps = entities.map((entity, entityIndex) => {
            if (
                Array.isArray(insertResult.raw) &&
                this.expressionMap.extraReturningColumns.length > 0
            ) {
                if (
                    this.queryRunner.dataSource.driver.options.type === "oracle"
                ) {
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
                    this.queryRunner.dataSource.driver.options.type ===
                    "spanner"
                ) {
                    insertResult.raw = insertResult.raw[0]
                }
            }

            // get all values generated by a database for us.
            // rawRowIndexes is set only when a conflict clause skipped rows: an
            // entity mapped to -1 had its row skipped and gets no values.
            const rawIndex = rawRowIndexes
                ? rawRowIndexes[entityIndex]
                : entityIndex
            const result = Array.isArray(insertResult.raw)
                ? rawIndex === -1
                    ? undefined
                    : insertResult.raw[rawIndex]
                : insertResult.raw

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
            const entityId = metadata.getEntityIdMap(entity)!
            insertResult.identifiers.push(entityId)
            insertResult.generatedMaps.push(generatedMaps[entityIndex])
        })
    }

    /**
     * Maps RETURNING rows back to the entities that produced them when a
     * conflict clause (orIgnore / orUpdate) may have skipped some rows, which
     * makes positional mapping wrong. Returns an array where index i holds the
     * index into insertResult.raw for entity i, or -1 when the entity has no
     * matching returned row (its row was skipped). Returns undefined when
     * positional mapping is correct and should be used as before.
     */
    protected mapReturnedRowsToEntitiesByConflictColumns(
        insertResult: InsertResult,
        entities: ObjectLiteral[],
        metadata: EntityMetadata,
    ): number[] | undefined {
        const raw = insertResult.raw
        if (
            !(this.expressionMap.onIgnore || this.expressionMap.onUpdate) ||
            !Array.isArray(raw) ||
            raw.length >= entities.length ||
            !raw.every(
                (row) =>
                    row != null &&
                    typeof row === "object" &&
                    !Array.isArray(row),
            )
        )
            return undefined

        const identifyingColumns =
            metadata.getUpsertConflictIdentificationColumns()
        if (identifyingColumns.length === 0) return undefined

        // Inserted rows come back in entity order (skipped ones are simply
        // absent), so walk both in order and consume a row only when it matches
        // the current entity's identifying values. Entities with no matching
        // row were skipped and keep their -1.
        const rawRowIndexes: number[] = new Array(entities.length).fill(-1)
        let rawIndex = 0
        for (
            let entityIndex = 0;
            entityIndex < entities.length && rawIndex < raw.length;
            entityIndex++
        ) {
            if (
                this.entityMatchesReturnedRow(
                    identifyingColumns,
                    entities[entityIndex],
                    raw[rawIndex],
                )
            ) {
                rawRowIndexes[entityIndex] = rawIndex
                rawIndex++
            }
        }

        return rawRowIndexes
    }

    /**
     * Checks whether a returned row belongs to the given entity by comparing
     * every identifying column the entity has a value for and that is present
     * in the row. Requires at least one such column to match, so a row is never
     * assigned to an entity it cannot be positively identified with.
     */
    protected entityMatchesReturnedRow(
        identifyingColumns: ColumnMetadata[],
        entity: ObjectLiteral,
        row: ObjectLiteral,
    ): boolean {
        let comparedColumns = 0
        for (const column of identifyingColumns) {
            const entityValue = column.getEntityValue(entity)
            if (entityValue === undefined) continue
            if (!(column.databaseName in row)) continue

            comparedColumns++
            const rowValue = row[column.databaseName]
            if (
                entityValue !== rowValue &&
                String(entityValue) !== String(rowValue)
            )
                return false
        }
        return comparedColumns > 0
    }

    /**
     * Columns we need to be returned from the database when we update entity.
     */
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
