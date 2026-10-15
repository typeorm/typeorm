import type { ObjectLiteral } from "../common/ObjectLiteral"
import type { QueryRunner } from "../query-runner/QueryRunner"
import type { QueryExpressionMap } from "./QueryExpressionMap"
import type { ColumnMetadata } from "../metadata/ColumnMetadata"
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
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Builds a key identifying the entity with the given id map.
     * Values are converted to their persisted form and stringified so that ids the driver
     * hydrates with another type (e.g. a date returned as a string or a bigint returned as a string)
     * still match the inserted ones.
     *
     * @param entityId id map of the entity
     * @returns key identifying the entity
     */
    protected getEntityIdKey(entityId: ObjectLiteral): string {
        const driver = this.queryRunner.dataSource.driver

        return JSON.stringify(
            this.expressionMap.mainAlias!.metadata.primaryColumns.map(
                (column) => {
                    const value = driver.preparePersistentValue(
                        column.getEntityValue(entityId),
                        column,
                    )
                    return typeof value === "object" && value !== null
                        ? JSON.stringify(value)
                        : String(value)
                },
            ),
        )
    }

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

            // the select has no ORDER BY, so the database may return the rows in any order
            // (e.g. sorted by primary key) - match them to the entities by their ids instead of their position
            const returningResultsById = new Map<string, ObjectLiteral>()

            for (const returningEntity of returningResult) {
                const returningEntityId =
                    metadata.getEntityIdMap(returningEntity)
                if (!returningEntityId) continue

                returningResultsById.set(
                    this.getEntityIdKey(returningEntityId),
                    returningEntity,
                )
            }

            entities.forEach((entity, entityIndex) => {
                const returningEntity = returningResultsById.get(
                    this.getEntityIdKey(entityIds[entityIndex]),
                )

                if (!returningEntity) return

                this.queryRunner.manager.merge(
                    metadata.target as any,
                    generatedMaps[entityIndex],
                    returningEntity,
                )

                this.queryRunner.manager.merge(
                    metadata.target as any,
                    entity,
                    returningEntity,
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
