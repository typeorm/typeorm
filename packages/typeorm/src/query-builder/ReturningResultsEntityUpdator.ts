import type { ObjectLiteral } from "../common/ObjectLiteral"
import type { QueryRunner } from "../query-runner/QueryRunner"
import type { QueryExpressionMap } from "./QueryExpressionMap"
import type { ColumnMetadata } from "../metadata/ColumnMetadata"
import type { UpdateResult } from "./result/UpdateResult"
import type { InsertResult } from "./result/InsertResult"
import { TypeORMError } from "../error"
import { OrmUtils } from "../util/OrmUtils"

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

            // get all values generated by a database for us
            const result = Array.isArray(insertResult.raw)
                ? insertResult.raw[entityIndex]
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

        // drivers without RETURNING derive generated ids from the statement's insert id,
        // which assumes every row was inserted; a multi-row upsert that updates some rows breaks that
        if (
            this.expressionMap.onUpdate &&
            entities.length > 1 &&
            !this.queryRunner.dataSource.driver.isReturningSqlSupported(
                "insert",
            )
        ) {
            await this.reloadUpsertedGeneratedIds(entities, generatedMaps)
        }

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
                // rows come back in database order, which differs from the input order for upserts
                const returningRow = returningResult.find(
                    (row: ObjectLiteral) =>
                        metadata.compareEntities(entity, row),
                )

                this.queryRunner.manager.merge(
                    metadata.target as any,
                    generatedMaps[entityIndex],
                    returningRow,
                )

                this.queryRunner.manager.merge(
                    metadata.target as any,
                    entity,
                    returningRow,
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
     * Re-selects generated primary keys of upserted rows by their conflict columns
     * and merges them into the entities and generated maps.
     *
     * @param entities - Upserted value sets, in input order.
     * @param generatedMaps - Generated values per entity, updated in place.
     */
    protected async reloadUpsertedGeneratedIds(
        entities: ObjectLiteral[],
        generatedMaps: ObjectLiteral[],
    ): Promise<void> {
        const metadata = this.expressionMap.mainAlias!.metadata
        const generatedPrimaryColumns = metadata.primaryColumns.filter(
            (column) => column.isGenerated,
        )
        const conflict = this.expressionMap.onUpdate.conflict
        const conflictColumns = (
            typeof conflict === "string" ? [conflict] : (conflict ?? [])
        ).map((databaseName) =>
            metadata.findColumnWithDatabaseName(databaseName),
        )

        if (
            generatedPrimaryColumns.length === 0 ||
            conflictColumns.length === 0 ||
            conflictColumns.some((column) => !column || column.relationMetadata)
        )
            return

        const uniqueColumns = conflictColumns as ColumnMetadata[]

        // without a value for every conflict column the criteria could match unrelated rows
        if (
            entities.some((entity) =>
                uniqueColumns.some(
                    (column) => column.getEntityValue(entity) == null,
                ),
            )
        )
            return

        const criteria = entities.map((entity) =>
            uniqueColumns.reduce(
                (map, column) =>
                    OrmUtils.mergeDeep(
                        map,
                        column.createValueMap(column.getEntityValue(entity)),
                    ),
                {} as ObjectLiteral,
            ),
        )

        const rows: ObjectLiteral[] = await this.queryRunner.manager
            .createQueryBuilder()
            .select(
                [...generatedPrimaryColumns, ...uniqueColumns].map(
                    (column) => metadata.targetName + "." + column.propertyPath,
                ),
            )
            .from(metadata.target, metadata.targetName)
            .where(criteria)
            .withDeleted()
            .setOption("create-pojo")
            .getMany()

        const isMatch = (
            row: ObjectLiteral,
            entity: ObjectLiteral,
            normalize: (value: string) => string,
        ) =>
            uniqueColumns.every(
                (column) =>
                    normalize(String(column.getEntityValue(row))) ===
                    normalize(String(column.getEntityValue(entity))),
            )

        entities.forEach((entity, entityIndex) => {
            // a case-insensitive collation can match a row whose stored value differs in case
            const row =
                rows.find((row) => isMatch(row, entity, (value) => value)) ??
                rows.find((row) =>
                    isMatch(row, entity, (value) => value.toLowerCase()),
                )
            if (!row) return

            const ids = generatedPrimaryColumns.reduce(
                (map, column) =>
                    OrmUtils.mergeDeep(
                        map,
                        column.createValueMap(column.getEntityValue(row)),
                    ),
                {} as ObjectLiteral,
            )
            OrmUtils.mergeDeep(generatedMaps[entityIndex], ids)
            this.queryRunner.manager.merge(metadata.target as any, entity, ids)
        })
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
