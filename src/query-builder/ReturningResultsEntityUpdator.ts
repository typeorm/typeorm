import { ObjectLiteral } from "../common/ObjectLiteral"
import { QueryRunner } from "../query-runner/QueryRunner"
import { QueryExpressionMap } from "./QueryExpressionMap"
import { ColumnMetadata } from "../metadata/ColumnMetadata"
import { UpdateResult } from "./result/UpdateResult"
import { InsertResult } from "./result/InsertResult"
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
                    this.queryRunner.connection.driver.isReturningSqlSupported(
                        "update",
                    )
                ) {
                    if (
                        this.queryRunner.connection.driver.options.type ===
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
                        this.queryRunner.connection.driver.createGeneratedMap(
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
            this.queryRunner.connection.driver.isReturningSqlSupported("insert")
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
                    this.queryRunner.connection.driver.options.type === "oracle"
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
                    this.queryRunner.connection.driver.options.type ===
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
                this.queryRunner.connection.driver.createGeneratedMap(
                    metadata,
                    result,
                    entityIndex,
                    entities.length,
                ) || {}

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
            !this.queryRunner.connection.driver.isReturningSqlSupported(
                "insert",
            )
        ) {
            // Collect only entities whose id is known. For upserts on drivers without
            // RETURNING support (e.g. MySQL), a no-op upsert (identical values already
            // in the DB) results in insertId=0, so the entity id is not set. In that
            // case we skip the re-fetch for that entity rather than throwing.
            const entitiesWithIds: {
                entityId: ObjectLiteral
                index: number
            }[] = []
            entities.forEach((entity, index) => {
                const entityId = metadata.getEntityIdMap(entity)
                if (entityId) {
                    entitiesWithIds.push({ entityId, index })
                }
            })

            if (entitiesWithIds.length > 0) {
                // to select just inserted entities we need a criteria to select by.
                // for newly inserted entities in drivers which do not support returning statement
                // row identifier can only be an increment column
                // (since its the only thing that can be generated by those databases)
                // or (and) other primary key which is defined by a user and inserted value has it

                const returningResult: any[] = await this.queryRunner.manager
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
                    .where(entitiesWithIds.map((e) => e.entityId))
                    .setOption("create-pojo") // use POJO because created object can contain default values, e.g. property = null and those properties might be overridden by merge process
                    .getMany()

                // Build a lookup from serialized PK → fetched row so that
                // positional mis-ordering of getMany() results cannot cause
                // values to be merged into the wrong entity.
                // Use getEntityValue() so embedded PKs (nested objects) are
                // resolved correctly instead of flat bracket-access by propertyPath.
                const pkSerializer = (row: ObjectLiteral) =>
                    metadata.primaryColumns
                        .map((c) => c.getEntityValue(row))
                        .join("\0")
                const resultByPk = new Map<string, any>(
                    returningResult.map((row) => [pkSerializer(row), row]),
                )

                entitiesWithIds.forEach(({ index, entityId }) => {
                    const key = metadata.primaryColumns
                        .map((c) => c.getEntityValue(entityId))
                        .join("\0")
                    const row = resultByPk.get(key)
                    if (!row) return

                    this.queryRunner.manager.merge(
                        metadata.target as any,
                        generatedMaps[index],
                        row,
                    )

                    this.queryRunner.manager.merge(
                        metadata.target as any,
                        entities[index],
                        row,
                    )
                })
            }
        }

        entities.forEach((entity, entityIndex) => {
            const entityId = metadata.getEntityIdMap(entity) ?? {}
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
