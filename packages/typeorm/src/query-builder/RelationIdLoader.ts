import type { RelationMetadata } from "../metadata/RelationMetadata"
import type { ColumnMetadata } from "../metadata/ColumnMetadata"
import type { DataSource } from "../data-source/DataSource"
import type { ObjectLiteral } from "../common/ObjectLiteral"
import type { SelectQueryBuilder } from "./SelectQueryBuilder"
import { DriverUtils } from "../driver/DriverUtils"
import { TypeORMError } from "../error/TypeORMError"
import type { QueryRunner } from "../query-runner/QueryRunner"
import { isUint8Array, uint8ArrayToHex } from "../util/Uint8ArrayUtils"

/**
 * Loads relation ids for the given entities.
 */
export class RelationIdLoader {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        private dataSource: DataSource,
        protected queryRunner?: QueryRunner | undefined,
        private readonly loadEagerRelations?: boolean,
    ) {}

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Loads relation ids of the given entity or entities.
     *
     * @param relation
     * @param entityOrEntities
     * @param relatedEntityOrRelatedEntities
     */
    load(
        relation: RelationMetadata,
        entityOrEntities: ObjectLiteral | ObjectLiteral[],
        relatedEntityOrRelatedEntities?: ObjectLiteral | ObjectLiteral[],
    ): Promise<any[]> {
        const entities = Array.isArray(entityOrEntities)
            ? entityOrEntities
            : [entityOrEntities]
        const relatedEntities = Array.isArray(relatedEntityOrRelatedEntities)
            ? relatedEntityOrRelatedEntities
            : relatedEntityOrRelatedEntities
              ? [relatedEntityOrRelatedEntities]
              : undefined

        // load relation ids depend of relation type
        if (relation.isManyToMany) {
            return this.loadForManyToMany(relation, entities, relatedEntities)
        } else if (relation.isManyToOne || relation.isOneToOneOwner) {
            return this.loadForManyToOneAndOneToOneOwner(
                relation,
                entities,
                relatedEntities,
            )
        } else {
            // if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            return this.loadForOneToManyAndOneToOneNotOwner(
                relation,
                entities,
                relatedEntities,
            )
        }
    }

    /**
     * Loads relation ids of the given entities and groups them into the object with parent and children.
     *
     * todo: extract this method?
     *
     * @param relation
     * @param entitiesOrEntities
     * @param relatedEntityOrEntities
     * @param queryBuilder
     */
    async loadManyToManyRelationIdsAndGroup<
        E1 extends ObjectLiteral,
        E2 extends ObjectLiteral,
    >(
        relation: RelationMetadata,
        entitiesOrEntities: E1 | E1[],
        relatedEntityOrEntities?: E2 | E2[],
        queryBuilder?: SelectQueryBuilder<any>,
    ): Promise<{ entity: E1; related?: E2 | E2[] }[]> {
        // console.log("relation:", relation.propertyName);
        // console.log("entitiesOrEntities", entitiesOrEntities);
        const isMany = relation.isManyToMany || relation.isOneToMany
        const entities: E1[] = Array.isArray(entitiesOrEntities)
            ? entitiesOrEntities
            : [entitiesOrEntities]

        if (!relatedEntityOrEntities) {
            relatedEntityOrEntities = await this.dataSource.relationLoader.load(
                relation,
                entitiesOrEntities,
                this.queryRunner,
                queryBuilder,
                this.loadEagerRelations,
            )
            if (!relatedEntityOrEntities.length)
                return entities.map((entity) => ({
                    entity: entity,
                    related: isMany ? [] : undefined,
                }))
        }
        // const relationIds = await this.load(relation, relatedEntityOrEntities!, entitiesOrEntities);
        const relationIds = await this.load(
            relation,
            entitiesOrEntities,
            relatedEntityOrEntities,
        )
        // console.log("entities", entities);
        // console.log("relatedEntityOrEntities", relatedEntityOrEntities);
        // console.log("relationIds", relationIds);

        const relatedEntities: E2[] = Array.isArray(relatedEntityOrEntities)
            ? relatedEntityOrEntities
            : [relatedEntityOrEntities!]

        let columns: ColumnMetadata[] = [],
            inverseColumns: ColumnMetadata[] = []
        if (relation.isManyToManyOwner) {
            columns = relation.junctionEntityMetadata!.inverseColumns.map(
                (column) => column.referencedColumn!,
            )
            inverseColumns = relation.junctionEntityMetadata!.ownerColumns.map(
                (column) => column.referencedColumn!,
            )
        } else if (relation.isManyToManyNotOwner) {
            columns = relation.junctionEntityMetadata!.ownerColumns.map(
                (column) => column.referencedColumn!,
            )
            inverseColumns =
                relation.junctionEntityMetadata!.inverseColumns.map(
                    (column) => column.referencedColumn!,
                )
        } else if (relation.isManyToOne || relation.isOneToOneOwner) {
            columns = relation.joinColumns.map(
                (column) => column.referencedColumn!,
            )
            inverseColumns = relation.entityMetadata.primaryColumns
        } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            columns = relation.inverseRelation!.entityMetadata.primaryColumns
            inverseColumns = relation.inverseRelation!.joinColumns.map(
                (column) => column.referencedColumn!,
            )
        } else {
        }

        const inverseColumnAliases = inverseColumns.map((column) =>
            DriverUtils.buildAlias(
                this.dataSource.driver,
                undefined,
                column.entityMetadata.name + "_" + column.propertyAliasName,
            ),
        )
        const columnAliases = columns.map((column) =>
            DriverUtils.buildAlias(
                this.dataSource.driver,
                undefined,
                column.entityMetadata.name +
                    "_" +
                    relation.propertyPath.replace(".", "_") +
                    "_" +
                    column.propertyPath.replace(".", "_"),
            ),
        )

        const groups: { entity: E1; related?: E2 | E2[] }[] = entities.map(
            (entity) => ({
                entity,
                related: isMany ? [] : undefined,
            }),
        )
        const groupsByEntityKey = new Map<
            string,
            { entity: E1; related?: E2 | E2[] }[]
        >()
        const fallbackGroups: { entity: E1; related?: E2 | E2[] }[] = []
        for (const group of groups) {
            const key = this.encodeLookupKey(
                inverseColumns.map((column) =>
                    column.getEntityValue(group.entity),
                ),
            )
            if (key !== null) {
                let bucket = groupsByEntityKey.get(key)
                if (!bucket) {
                    bucket = []
                    groupsByEntityKey.set(key, bucket)
                }
                bucket.push(group)
            } else {
                fallbackGroups.push(group)
            }
        }

        const relationIdsByRelatedKey = new Map<
            string,
            { relationId: any; entityKey: string | null }[]
        >()
        const encodedRelationIds: {
            relationId: any
            entityKey: string | null
        }[] = []
        for (const relationId of relationIds) {
            const entry = {
                relationId,
                entityKey: this.encodeLookupKey(
                    inverseColumnAliases.map((alias) => relationId[alias]),
                ),
            }
            encodedRelationIds.push(entry)
            const relatedKey = this.encodeLookupKey(
                columnAliases.map((alias) => relationId[alias]),
            )
            if (relatedKey !== null) {
                let bucket = relationIdsByRelatedKey.get(relatedKey)
                if (!bucket) {
                    bucket = []
                    relationIdsByRelatedKey.set(relatedKey, bucket)
                }
                bucket.push(entry)
            }
        }

        // Iterate relatedEntities in order so each group's related array keeps
        // the exact relatedEntities order and to-one last-match semantics in
        // linear time without per-parent sorting or temporary arrays.
        for (const relatedEntity of relatedEntities) {
            const relatedKey = this.encodeLookupKey(
                columns.map((column) => column.getEntityValue(relatedEntity)),
            )
            const matchingRelationIds =
                relatedKey !== null
                    ? (relationIdsByRelatedKey.get(relatedKey) ?? [])
                    : encodedRelationIds.filter(({ relationId }) =>
                          columns.every((column, index) =>
                              column.compareEntityValue(
                                  relatedEntity,
                                  relationId[columnAliases[index]],
                              ),
                          ),
                      )

            for (const { relationId, entityKey } of matchingRelationIds) {
                if (entityKey !== null) {
                    const matchedGroups = groupsByEntityKey.get(entityKey)
                    if (matchedGroups) {
                        for (const group of matchedGroups) {
                            if (isMany) {
                                ;(group.related as E2[]).push(relatedEntity)
                            } else {
                                group.related = relatedEntity
                            }
                        }
                    }
                }
                for (const group of fallbackGroups) {
                    const matched = inverseColumns.every((column, index) =>
                        column.compareEntityValue(
                            group.entity,
                            relationId[inverseColumnAliases[index]],
                        ),
                    )
                    if (matched) {
                        if (isMany) {
                            ;(group.related as E2[]).push(relatedEntity)
                        } else {
                            group.related = relatedEntity
                        }
                    }
                }
            }
        }

        return groups
    }

    /**
     * Encodes column values into a collision-free string key that matches
     * `ColumnMetadata.compareEntityValue` semantics. Returns `null` if any
     * value requires `compareEntityValue` fallback (custom `.equals()`, `NaN`,
     * or non-Uint8Array objects).
     *
     * @param values
     */
    protected encodeLookupKey(values: unknown[]): string | null {
        if (values.length === 0) return ""
        if (values.length === 1) {
            const value = values[0]
            if (value === null) return "null"
            if (value === undefined) return "u"
            if (typeof value === "number") {
                if (Number.isNaN(value)) return null
                return "n:" + (Object.is(value, -0) ? "0" : String(value))
            }
            if (typeof value === "string") return "s:" + value
            if (typeof value === "bigint") return "b:" + value.toString()
            if (typeof value === "boolean") return value ? "t" : "f"
            if (isUint8Array(value)) return "x:" + uint8ArrayToHex(value)
            return null
        }

        const parts: unknown[] = new Array(values.length)
        for (let i = 0; i < values.length; i++) {
            const value = values[i]
            if (value === null) {
                parts[i] = 0
            } else if (value === undefined) {
                parts[i] = 1
            } else if (typeof value === "boolean") {
                parts[i] = value ? 2 : 3
            } else if (typeof value === "number") {
                if (Number.isNaN(value)) return null
                parts[i] = [4, Object.is(value, -0) ? "0" : String(value)]
            } else if (typeof value === "string") {
                parts[i] = [5, value]
            } else if (typeof value === "bigint") {
                parts[i] = [6, value.toString()]
            } else if (isUint8Array(value)) {
                parts[i] = [7, uint8ArrayToHex(value)]
            } else {
                return null
            }
        }
        return JSON.stringify(parts)
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Loads relation ids for the many-to-many relation.
     *
     * @param relation
     * @param entities
     * @param relatedEntities
     */
    protected loadForManyToMany(
        relation: RelationMetadata,
        entities: ObjectLiteral[],
        relatedEntities?: ObjectLiteral[],
    ) {
        const junctionMetadata = relation.junctionEntityMetadata!
        const mainAlias = junctionMetadata.name
        const columns = relation.isOwning
            ? junctionMetadata.ownerColumns
            : junctionMetadata.inverseColumns
        const inverseColumns = relation.isOwning
            ? junctionMetadata.inverseColumns
            : junctionMetadata.ownerColumns
        const fieldsToMetadata = new Map<string, ColumnMetadata>()
        const qb = this.dataSource.createQueryBuilder(this.queryRunner)

        // select all columns from junction table
        columns.forEach((column) => {
            const referenced = column.referencedColumn
            if (!referenced) {
                throw new TypeORMError(
                    `Column "${column.propertyPath}" is missing a referencedColumn in junction table "${junctionMetadata.tableName}".`,
                )
            }

            const columnName = DriverUtils.buildAlias(
                this.dataSource.driver,
                undefined,
                referenced.entityMetadata.name +
                    "_" +
                    referenced.propertyPath.replace(".", "_"),
            )
            fieldsToMetadata.set(columnName, referenced)
            qb.addSelect(mainAlias + "." + column.propertyPath, columnName)
        })
        inverseColumns.forEach((column) => {
            const referenced = column.referencedColumn
            if (!referenced) {
                throw new TypeORMError(
                    `Column "${column.propertyPath}" is missing a referencedColumn in junction table "${junctionMetadata.tableName}".`,
                )
            }

            const columnName = DriverUtils.buildAlias(
                this.dataSource.driver,
                undefined,
                referenced.entityMetadata.name +
                    "_" +
                    relation.propertyPath.replace(".", "_") +
                    "_" +
                    referenced.propertyPath.replace(".", "_"),
            )
            fieldsToMetadata.set(columnName, referenced)
            qb.addSelect(mainAlias + "." + column.propertyPath, columnName)
        })

        // add conditions for the given entities
        let condition1: string
        if (columns.length === 1) {
            const values = entities.map((entity) =>
                columns[0].referencedColumn!.getEntityValue(entity),
            )
            const areAllNumbers = values.every(
                (value) => typeof value === "number",
            )

            if (areAllNumbers) {
                condition1 = `${mainAlias}.${
                    columns[0].propertyPath
                } IN (${values.join(", ")})`
            } else {
                qb.setParameter("values1", values)
                condition1 =
                    mainAlias +
                    "." +
                    columns[0].propertyPath +
                    " IN (:...values1)" // todo: use ANY for postgres
            }
        } else {
            condition1 =
                "(" +
                entities
                    .map((entity, entityIndex) => {
                        return columns
                            .map((column) => {
                                const paramName =
                                    "entity1_" +
                                    entityIndex +
                                    "_" +
                                    column.propertyName
                                qb.setParameter(
                                    paramName,
                                    column.referencedColumn!.getEntityValue(
                                        entity,
                                    ),
                                )
                                return (
                                    mainAlias +
                                    "." +
                                    column.propertyPath +
                                    " = :" +
                                    paramName
                                )
                            })
                            .join(" AND ")
                    })
                    .map((condition) => "(" + condition + ")")
                    .join(" OR ") +
                ")"
        }

        // add conditions for the given inverse entities
        let condition2 = ""
        if (relatedEntities) {
            if (inverseColumns.length === 1) {
                const values = relatedEntities.map((entity) =>
                    inverseColumns[0].referencedColumn!.getEntityValue(entity),
                )
                const areAllNumbers = values.every(
                    (value) => typeof value === "number",
                )

                if (areAllNumbers) {
                    condition2 = `${mainAlias}.${
                        inverseColumns[0].propertyPath
                    } IN (${values.join(", ")})`
                } else {
                    qb.setParameter("values2", values)
                    condition2 =
                        mainAlias +
                        "." +
                        inverseColumns[0].propertyPath +
                        " IN (:...values2)" // todo: use ANY for postgres
                }
            } else {
                condition2 =
                    "(" +
                    relatedEntities
                        .map((entity, entityIndex) => {
                            return inverseColumns
                                .map((column) => {
                                    const paramName =
                                        "entity2_" +
                                        entityIndex +
                                        "_" +
                                        column.propertyName
                                    qb.setParameter(
                                        paramName,
                                        column.referencedColumn!.getEntityValue(
                                            entity,
                                        ),
                                    )
                                    return (
                                        mainAlias +
                                        "." +
                                        column.propertyPath +
                                        " = :" +
                                        paramName
                                    )
                                })
                                .join(" AND ")
                        })
                        .map((condition) => "(" + condition + ")")
                        .join(" OR ") +
                    ")"
            }
        }

        // execute query
        const condition = [condition1, condition2]
            .filter((v) => v.length > 0)
            .join(" AND ")
        return this.executeAndHydrateRaw(
            qb,
            junctionMetadata.target,
            mainAlias,
            condition,
            fieldsToMetadata,
        )
    }

    /**
     * Loads relation ids for the many-to-one and one-to-one owner relations.
     *
     * @param relation
     * @param entities
     * @param relatedEntities
     */
    protected loadForManyToOneAndOneToOneOwner(
        relation: RelationMetadata,
        entities: ObjectLiteral[],
        relatedEntities?: ObjectLiteral[],
    ) {
        const mainAlias = relation.entityMetadata.targetName
        const fieldsToMetadata = new Map<string, ColumnMetadata>()

        const hasAllJoinColumnsInEntity = relation.joinColumns.every(
            (joinColumn) => {
                return !!relation.entityMetadata.nonVirtualColumns.find(
                    (column) => column === joinColumn,
                )
            },
        )
        if (relatedEntities && hasAllJoinColumnsInEntity) {
            const relationIdMaps: ObjectLiteral[] = []
            entities.forEach((entity) => {
                const relationIdMap: ObjectLiteral = {}
                relation.entityMetadata.primaryColumns.forEach(
                    (primaryColumn) => {
                        const key = DriverUtils.buildAlias(
                            this.dataSource.driver,
                            undefined,
                            primaryColumn.entityMetadata.name +
                                "_" +
                                primaryColumn.propertyPath.replace(".", "_"),
                        )
                        relationIdMap[key] =
                            primaryColumn.getEntityValue(entity)
                    },
                )

                relatedEntities.forEach((relatedEntity) => {
                    relation.joinColumns.forEach((joinColumn) => {
                        const entityColumnValue =
                            joinColumn.getEntityValue(entity)
                        const relatedEntityColumnValue =
                            joinColumn.referencedColumn!.getEntityValue(
                                relatedEntity,
                            )
                        if (
                            entityColumnValue === undefined ||
                            relatedEntityColumnValue === undefined
                        )
                            return

                        if (entityColumnValue === relatedEntityColumnValue) {
                            const key = DriverUtils.buildAlias(
                                this.dataSource.driver,
                                undefined,
                                joinColumn.referencedColumn!.entityMetadata
                                    .name +
                                    "_" +
                                    relation.propertyPath.replace(".", "_") +
                                    "_" +
                                    joinColumn.referencedColumn!.propertyPath.replace(
                                        ".",
                                        "_",
                                    ),
                            )
                            relationIdMap[key] = relatedEntityColumnValue
                        }
                    })
                })
                if (
                    Object.keys(relationIdMap).length ===
                    relation.entityMetadata.primaryColumns.length +
                        relation.joinColumns.length
                ) {
                    relationIdMaps.push(relationIdMap)
                }
            })
            // console.log("relationIdMap", relationIdMaps);
            // console.log("entities.length", entities.length);
            if (relationIdMaps.length === entities.length)
                return Promise.resolve(relationIdMaps)
        }

        // select all columns we need
        const qb = this.dataSource.createQueryBuilder(this.queryRunner)
        relation.entityMetadata.primaryColumns.forEach((primaryColumn) => {
            const columnName = DriverUtils.buildAlias(
                this.dataSource.driver,
                undefined,
                primaryColumn.entityMetadata.name +
                    "_" +
                    primaryColumn.propertyPath.replace(".", "_"),
            )
            fieldsToMetadata.set(columnName, primaryColumn)
            qb.addSelect(
                mainAlias + "." + primaryColumn.propertyPath,
                columnName,
            )
        })
        relation.joinColumns.forEach((column) => {
            const referenced = column.referencedColumn
            if (!referenced) {
                throw new TypeORMError(
                    `Join column "${column.propertyPath}" on "${relation.entityMetadata.targetName}" is missing a referencedColumn.`,
                )
            }

            const columnName = DriverUtils.buildAlias(
                this.dataSource.driver,
                undefined,
                referenced.entityMetadata.name +
                    "_" +
                    relation.propertyPath.replace(".", "_") +
                    "_" +
                    referenced.propertyPath.replace(".", "_"),
            )
            fieldsToMetadata.set(columnName, referenced)
            qb.addSelect(mainAlias + "." + column.propertyPath, columnName)
        })

        // add condition for entities
        let condition: string
        if (relation.entityMetadata.primaryColumns.length === 1) {
            const values = entities.map((entity) =>
                relation.entityMetadata.primaryColumns[0].getEntityValue(
                    entity,
                ),
            )
            const areAllNumbers = values.every(
                (value) => typeof value === "number",
            )

            if (areAllNumbers) {
                condition = `${mainAlias}.${
                    relation.entityMetadata.primaryColumns[0].propertyPath
                } IN (${values.join(", ")})`
            } else {
                qb.setParameter("values", values)
                condition =
                    mainAlias +
                    "." +
                    relation.entityMetadata.primaryColumns[0].propertyPath +
                    " IN (:...values)" // todo: use ANY for postgres
            }
        } else {
            condition = entities
                .map((entity, entityIndex) => {
                    return relation.entityMetadata.primaryColumns
                        .map((column, columnIndex) => {
                            const paramName =
                                "entity" + entityIndex + "_" + columnIndex
                            qb.setParameter(
                                paramName,
                                column.getEntityValue(entity),
                            )
                            return (
                                mainAlias +
                                "." +
                                column.propertyPath +
                                " = :" +
                                paramName
                            )
                        })
                        .join(" AND ")
                })
                .map((condition) => "(" + condition + ")")
                .join(" OR ")
        }

        // execute query
        return this.executeAndHydrateRaw(
            qb,
            relation.entityMetadata.target,
            mainAlias,
            condition,
            fieldsToMetadata,
        )
    }

    /**
     * Loads relation ids for the one-to-many and one-to-one not owner relations.
     *
     * @param relation
     * @param entities
     * @param relatedEntities
     */
    protected loadForOneToManyAndOneToOneNotOwner(
        relation: RelationMetadata,
        entities: ObjectLiteral[],
        relatedEntities?: ObjectLiteral[],
    ) {
        const originalRelation = relation
        relation = relation.inverseRelation!
        const fieldsToMetadata = new Map<string, ColumnMetadata>()

        if (
            relation.entityMetadata.primaryColumns.length ===
            relation.joinColumns.length
        ) {
            const sameReferencedColumns =
                relation.entityMetadata.primaryColumns.every((column) => {
                    return relation.joinColumns.indexOf(column) !== -1
                })
            if (sameReferencedColumns) {
                return Promise.resolve(
                    entities.map((entity) => {
                        const result: ObjectLiteral = {}
                        relation.joinColumns.forEach((joinColumn) => {
                            const value =
                                joinColumn.referencedColumn!.getEntityValue(
                                    entity,
                                )
                            const joinColumnName = DriverUtils.buildAlias(
                                this.dataSource.driver,
                                undefined,
                                joinColumn.referencedColumn!.entityMetadata
                                    .name +
                                    "_" +
                                    joinColumn.referencedColumn!.propertyPath.replace(
                                        ".",
                                        "_",
                                    ),
                            )
                            const primaryColumnName = DriverUtils.buildAlias(
                                this.dataSource.driver,
                                undefined,
                                joinColumn.entityMetadata.name +
                                    "_" +
                                    originalRelation.propertyPath.replace(
                                        ".",
                                        "_",
                                    ) +
                                    "_" +
                                    joinColumn.propertyPath.replace(".", "_"),
                            )
                            result[joinColumnName] = value
                            result[primaryColumnName] = value
                        })
                        return result
                    }),
                )
            }
        }

        const mainAlias = relation.entityMetadata.targetName

        // select all columns we need
        const qb = this.dataSource.createQueryBuilder(this.queryRunner)
        relation.entityMetadata.primaryColumns.forEach((primaryColumn) => {
            const columnName = DriverUtils.buildAlias(
                this.dataSource.driver,
                undefined,
                primaryColumn.entityMetadata.name +
                    "_" +
                    originalRelation.propertyPath.replace(".", "_") +
                    "_" +
                    primaryColumn.propertyPath.replace(".", "_"),
            )
            fieldsToMetadata.set(columnName, primaryColumn)
            qb.addSelect(
                mainAlias + "." + primaryColumn.propertyPath,
                columnName,
            )
        })
        relation.joinColumns.forEach((column) => {
            const referenced = column.referencedColumn
            if (!referenced) {
                throw new TypeORMError(
                    `Join column "${column.propertyPath}" on "${relation.entityMetadata.targetName}" is missing a referencedColumn.`,
                )
            }

            const columnName = DriverUtils.buildAlias(
                this.dataSource.driver,
                undefined,
                referenced.entityMetadata.name +
                    "_" +
                    referenced.propertyPath.replace(".", "_"),
            )
            fieldsToMetadata.set(columnName, referenced)
            qb.addSelect(mainAlias + "." + column.propertyPath, columnName)
        })

        // add condition for entities
        let condition: string
        if (relation.joinColumns.length === 1) {
            const values = entities.map((entity) =>
                relation.joinColumns[0].referencedColumn!.getEntityValue(
                    entity,
                ),
            )
            const areAllNumbers = values.every(
                (value) => typeof value === "number",
            )

            if (areAllNumbers) {
                condition = `${mainAlias}.${
                    relation.joinColumns[0].propertyPath
                } IN (${values.join(", ")})`
            } else {
                qb.setParameter("values", values)
                condition =
                    mainAlias +
                    "." +
                    relation.joinColumns[0].propertyPath +
                    " IN (:...values)" // todo: use ANY for postgres
            }
        } else {
            condition = entities
                .map((entity, entityIndex) => {
                    return relation.joinColumns
                        .map((joinColumn, joinColumnIndex) => {
                            const paramName =
                                "entity" + entityIndex + "_" + joinColumnIndex
                            qb.setParameter(
                                paramName,
                                joinColumn.referencedColumn!.getEntityValue(
                                    entity,
                                ),
                            )
                            return (
                                mainAlias +
                                "." +
                                joinColumn.propertyPath +
                                " = :" +
                                paramName
                            )
                        })
                        .join(" AND ")
                })
                .map((condition) => "(" + condition + ")")
                .join(" OR ")
        }

        // execute query
        return this.executeAndHydrateRaw(
            qb,
            relation.entityMetadata.target,
            mainAlias,
            condition,
            fieldsToMetadata,
        )
    }

    /**
     * Executes a raw query and hydrates the results using driver-specific
     * value preparation based on the column metadata.
     *
     * @param qb
     * @param target
     * @param mainAlias
     * @param condition
     * @param fieldsToMetadata
     */
    private executeAndHydrateRaw(
        qb: SelectQueryBuilder<any>,
        target: Function | string,
        mainAlias: string,
        condition: string,
        fieldsToMetadata: Map<string, ColumnMetadata>,
    ): Promise<ObjectLiteral[]> {
        return qb
            .from(target, mainAlias)
            .where(condition)
            .getRawMany()
            .then((result) => {
                result.forEach((data) => {
                    Object.keys(data).forEach((key) => {
                        const column = fieldsToMetadata.get(key)
                        if (column) {
                            data[key] =
                                this.dataSource.driver.prepareHydratedValue(
                                    data[key],
                                    column,
                                )
                        }
                    })
                })
                return result
            })
    }
}
