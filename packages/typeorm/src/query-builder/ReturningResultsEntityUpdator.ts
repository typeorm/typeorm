import type { ObjectLiteral } from "../common/ObjectLiteral"
import type { QueryRunner } from "../query-runner/QueryRunner"
import type { QueryExpressionMap } from "./QueryExpressionMap"
import type { ColumnMetadata } from "../metadata/ColumnMetadata"
import type { EntityMetadata } from "../metadata/EntityMetadata"
import type { EmbeddedMetadata } from "../metadata/EmbeddedMetadata"
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
    ): Promise<ObjectLiteral[]> {
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

        // Upsert (orUpdate) must not mutate the caller's input objects. For
        // drivers without RETURNING (e.g. mysql, sqlite) the generated primary
        // key is fabricated from the driver insert id and merged back into each
        // entity in place; on an ON DUPLICATE KEY UPDATE / ON CONFLICT DO UPDATE
        // this writes a wrong id onto rows that were updated, silently
        // corrupting the passed-in objects (issue #12094). When this is an
        // upsert, work on clones so the originals are left untouched; the
        // generated values are still surfaced via insertResult.generatedMaps and
        // insertResult.identifiers.
        const isUpsert = this.expressionMap.onUpdate != null
        const targetEntities = isUpsert
            ? entities.map((entity) =>
                  this.cloneEntityForUpsert(entity, metadata),
              )
            : entities

        const generatedMaps = targetEntities.map((entity, entityIndex) => {
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
            const entityIds = targetEntities.map((entity) => {
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

            targetEntities.forEach((entity, entityIndex) => {
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

        targetEntities.forEach((entity, entityIndex) => {
            const entityId = metadata.getEntityIdMap(entity)!
            insertResult.identifiers.push(entityId)
            insertResult.generatedMaps.push(generatedMaps[entityIndex])
        })

        // Returns the entities carrying the generated values. For a plain insert
        // these are the original input objects (mutated in place as before); for
        // an upsert they are the clones, so callers never see their objects
        // mutated while after-insert listeners still receive the generated values.
        return targetEntities
    }

    /**
     * Clones an entity for an upsert so the caller's object is never mutated.
     * OrmUtils.cloneObject is shallow, so embedded objects would still be shared
     * by reference and merged into in place; clone the embedded tree as well to
     * keep the original fully untouched.
     */
    protected cloneEntityForUpsert(
        entity: ObjectLiteral,
        metadata: EntityMetadata,
    ): ObjectLiteral {
        const clone = OrmUtils.cloneObject(entity)
        this.cloneEmbeddeds(clone, metadata.embeddeds)
        return clone
    }

    /**
     * Replaces each embedded object on the target with a shallow clone,
     * recursing into nested embeddeds. Only the embedded tree is followed
     * (never relations), so there is no risk of cyclic traversal.
     */
    protected cloneEmbeddeds(
        target: ObjectLiteral,
        embeddeds: EmbeddedMetadata[],
    ): void {
        for (const embedded of embeddeds) {
            const value = target[embedded.propertyName]
            if (
                value != null &&
                typeof value === "object" &&
                !Array.isArray(value)
            ) {
                const embeddedClone = OrmUtils.cloneObject(value)
                // Define an own data property rather than assigning through
                // `target[propertyName] = ...`: the clone keeps the entity
                // prototype, so a getter-only mapped embedded would make a
                // plain assignment throw after the insert has already run.
                Object.defineProperty(target, embedded.propertyName, {
                    value: embeddedClone,
                    writable: true,
                    enumerable: true,
                    configurable: true,
                })
                if (embedded.embeddeds.length > 0) {
                    this.cloneEmbeddeds(embeddedClone, embedded.embeddeds)
                }
            }
        }
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
