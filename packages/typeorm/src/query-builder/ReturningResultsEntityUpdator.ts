import type { ObjectLiteral } from "../common/ObjectLiteral"
import type { QueryRunner } from "../query-runner/QueryRunner"
import type { QueryExpressionMap } from "./QueryExpressionMap"
import type { ColumnMetadata } from "../metadata/ColumnMetadata"
import type { UpdateResult } from "./result/UpdateResult"
import type { InsertResult } from "./result/InsertResult"
import { TypeORMError } from "../error"
import { DriverUtils } from "../driver/DriverUtils"
import type { WhereClauseCondition } from "./WhereClause"
import type { OracleDriver } from "../driver/oracle/OracleDriver"
import { isUint8Array, uint8ArrayToHex } from "../util/Uint8ArrayUtils"

interface BoundPrimaryKey {
    values: unknown[]
    parameters: string[]
}

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
     * @param getEntityPredicates Lazily renders the original identity predicates for database matching.
     */
    async update(
        updateResult: UpdateResult,
        entities: ObjectLiteral[],
        getEntityPredicates: () => string[] = () => [],
    ): Promise<void> {
        const metadata = this.expressionMap.mainAlias!.metadata
        const driver = this.queryRunner.dataSource.driver
        let returnedRows: (ObjectLiteral | undefined)[] = []

        if (driver.isReturningSqlSupported("update")) {
            if (
                driver.options.type === "oracle" &&
                Array.isArray(updateResult.raw) &&
                this.expressionMap.extraReturningColumns.length > 0 &&
                typeof this.expressionMap.returning !== "string"
            ) {
                const columns = (this.expressionMap.returning ?? []).flatMap(
                    (propertyPath) =>
                        metadata.findColumnsWithPropertyPath(propertyPath),
                )
                columns.push(
                    ...this.expressionMap.extraReturningColumns.filter(
                        (column) => !columns.includes(column),
                    ),
                )
                // each out bind holds one column's values, one per updated row
                const columnValues: unknown[][] = updateResult.raw
                updateResult.raw = (columnValues[0] ?? []).map((_, rowIndex) =>
                    columns.reduce((row, column, columnIndex) => {
                        row[column.databaseName] =
                            columnValues[columnIndex][rowIndex]
                        return row
                    }, {} as ObjectLiteral),
                )
            }
            returnedRows = await this.getReturnedRows(
                updateResult.raw,
                entities,
                getEntityPredicates,
            )
        }

        await Promise.all(
            entities.map(async (entity, entityIndex) => {
                // if database supports returning/output statement then we already should have updating values in the raw data returned by insert query
                if (
                    this.queryRunner.dataSource.driver.isReturningSqlSupported(
                        "update",
                    )
                ) {
                    const result = returnedRows[entityIndex]
                    const returningColumns =
                        this.queryRunner.dataSource.driver.createGeneratedMap(
                            metadata,
                            result,
                        )
                    if (returningColumns) {
                        let entityColumns = returningColumns
                        if (
                            (this.expressionMap.queryType === "soft-delete" ||
                                this.expressionMap.queryType === "restore") &&
                            typeof this.expressionMap.returning !== "string"
                        ) {
                            // Identity columns locate the row; they must not replace
                            // a transformed or numeric ID already held by the entity.
                            const values = { ...result }
                            for (const column of metadata.primaryColumns) {
                                delete values[column.databaseName]
                            }
                            entityColumns = driver.createGeneratedMap(
                                metadata,
                                values,
                            )!
                        }
                        this.queryRunner.manager.merge(
                            metadata.target as any,
                            entity,
                            entityColumns,
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
                    column.isPrimary ||
                    column.isVersion ||
                    column.isDeleteDate
                )
            },
        )
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Returns the row of each entity, in entity order.
     * Soft-delete and restore skip rows that are already in the target state, and the
     * database returns the updated rows in its own order, so their rows are matched to
     * the entities by primary key.
     *
     * @param raw Captured rows returned by the update.
     * @param entities Input entities in their original order.
     * @param getEntityPredicates Lazily renders the original identity predicates.
     * @returns One matching row per input, or undefined for an unaffected entity.
     */
    protected async getReturnedRows(
        raw: ObjectLiteral | ObjectLiteral[],
        entities: ObjectLiteral[],
        getEntityPredicates: () => string[],
    ): Promise<(ObjectLiteral | undefined)[]> {
        const { queryType, returning, whereEntityConditions, wheres } =
            this.expressionMap
        if (
            (queryType !== "soft-delete" && queryType !== "restore") ||
            typeof returning === "string"
        )
            return entities.map((_, index) =>
                Array.isArray(raw) ? raw[index] : raw,
            )

        const rows = Array.isArray(raw) ? raw : raw ? [raw] : []
        if (rows.length === 0) return []

        // Only the original identity predicate can establish this without parsing
        // additional raw SQL, whose operator precedence could broaden the update.
        if (
            entities.length === 1 &&
            rows.length === 1 &&
            whereEntityConditions.length === 1 &&
            wheres.length === 1 &&
            wheres[0].condition === whereEntityConditions[0]
        )
            return rows

        const metadata = this.expressionMap.mainAlias!.metadata
        const driver = this.queryRunner.dataSource.driver
        const isPostgresFamily = DriverUtils.isPostgresFamily(driver)
        const isSqlServer = driver.options.type === "mssql"
        const primaryTypes = metadata.primaryColumns.map((column) =>
            driver.normalizeType(column),
        )
        const canonicalUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        const normalize = (value: unknown, index: number): unknown => {
            const type = primaryTypes[index]
            if (
                (type === "bigint" || type === "int8") &&
                (typeof value === "number" || typeof value === "bigint")
            )
                return String(value)
            if (
                (isPostgresFamily || isSqlServer) &&
                (type === "uuid" ||
                    (isSqlServer && type === "uniqueidentifier")) &&
                typeof value === "string" &&
                !canonicalUuid.test(value)
            ) {
                value = value.toLowerCase()
                if (isPostgresFamily) {
                    if (driver.options.type === "cockroachdb")
                        value = (value as string).replace(/^urn:uuid:/, "")
                    value = (value as string)
                        .replaceAll(/[{}-]/g, "")
                        .replace(
                            /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
                            "$1-$2-$3-$4-$5",
                        )
                }
            }
            return value
        }
        const scalarPrimary =
            metadata.primaryColumns.length === 1 &&
            rows.every((row) => {
                const value = row[metadata.primaryColumns[0].databaseName]
                return value !== null && typeof value !== "object"
            })
        const getKey = (values: unknown[]): unknown => {
            if (scalarPrimary) {
                const value = normalize(values[0], 0)
                return value !== null && typeof value !== "object"
                    ? value
                    : undefined
            }
            const normalized = values.map(normalize)
            if (
                normalized.some(
                    (value) =>
                        value === undefined ||
                        (value !== null &&
                            typeof value === "object" &&
                            !(value instanceof Date) &&
                            !isUint8Array(value)),
                )
            )
                return undefined
            return JSON.stringify(
                normalized.map((value) =>
                    value instanceof Date
                        ? ["date", value.getTime()]
                        : isUint8Array(value)
                          ? ["buffer", uint8ArrayToHex(value)]
                          : [typeof value, String(value)],
                ),
            )
        }
        const rowsById = new Map<unknown, ObjectLiteral>()
        for (const row of rows) {
            const key = getKey(
                metadata.primaryColumns.map(
                    (column) => row[column.databaseName],
                ),
            )
            if (key !== undefined) rowsById.set(key, row)
        }
        const boundIds = whereEntityConditions.map((condition) =>
            this.getBoundPrimaryValues(condition),
        )
        const matchedRows = entities.map((_, index) => {
            const values = boundIds[index]?.values
            const key = values && getKey(values)
            return key === undefined ? undefined : rowsById.get(key)
        })
        if (matchedRows.every((row) => row !== undefined)) return matchedRows

        // A missing integer/UUID key is definitive, unlike text under a database
        // collation. Do not query again for rows excluded by the state guard.
        const exactTypes = primaryTypes.map((type) => {
            if (driver.options.type === "oracle" && type === "number")
                return "integer"
            if (
                [
                    "int",
                    "integer",
                    "smallint",
                    "tinyint",
                    "mediumint",
                    "int2",
                    "int4",
                ].includes(type)
            )
                return "integer"
            if (type === "bigint" || type === "int8") return "bigint"
            if (
                (isPostgresFamily && type === "uuid") ||
                (isSqlServer && type === "uniqueidentifier")
            )
                return "uuid"
            return undefined
        })
        const isExactValue = (value: unknown, index: number): boolean => {
            const normalized = normalize(value, index)
            switch (exactTypes[index]) {
                case "integer":
                    return (
                        typeof normalized === "number" &&
                        Number.isSafeInteger(normalized)
                    )
                case "bigint":
                    return (
                        (typeof value !== "number" ||
                            Number.isSafeInteger(value)) &&
                        typeof normalized === "string" &&
                        /^(0|-?[1-9]\d*)$/.test(normalized)
                    )
                case "uuid":
                    return (
                        typeof normalized === "string" &&
                        canonicalUuid.test(normalized)
                    )
                default:
                    return false
            }
        }
        const exactRows = rows.every((row) =>
            metadata.primaryColumns.every((column, index) =>
                isExactValue(row[column.databaseName], index),
            ),
        )
        const unmatched = matchedRows.flatMap((row, index) =>
            row || (exactRows && boundIds[index]?.values.every(isExactValue))
                ? []
                : [index],
        )
        if (unmatched.length) {
            await this.matchReturnedRows(
                rows,
                unmatched,
                boundIds,
                getEntityPredicates,
                matchedRows,
            )
        }
        return matchedRows
    }

    /**
     * Read the values actually bound to WHERE, without invoking transformers again.
     *
     * @param condition Original identity predicate.
     * @returns Bound primary values and parameter references for simple equality predicates.
     */
    protected getBoundPrimaryValues(
        condition: WhereClauseCondition,
    ): BoundPrimaryKey | undefined {
        const columns = this.expressionMap.mainAlias!.metadata.primaryColumns
        const single =
            Array.isArray(condition) && condition.length === 1
                ? condition[0].condition
                : undefined
        if (
            columns.length === 1 &&
            single &&
            !Array.isArray(single) &&
            typeof single !== "string" &&
            single.operator === "equal" &&
            single.parameters[0] === columns[0].propertyPath &&
            /^:orm_param_\d+$/.test(single.parameters[1])
        ) {
            const parameter = single.parameters[1]
            return {
                values: [this.expressionMap.parameters[parameter.slice(1)]],
                parameters: [parameter],
            }
        }
        const parameters = new Map<string, string>()
        const collect = (condition: WhereClauseCondition): boolean => {
            if (Array.isArray(condition))
                return condition.every((where) => collect(where.condition))
            if (typeof condition === "string") return false
            if (condition.operator === "brackets")
                return collect(condition.condition)
            if (
                condition.operator !== "equal" ||
                parameters.has(condition.parameters[0]) ||
                !/^:orm_param_\d+$/.test(condition.parameters[1])
            )
                return false
            parameters.set(
                condition.parameters[0],
                condition.parameters[1].slice(1),
            )
            return true
        }
        if (
            !collect(condition) ||
            columns.some((column) => !parameters.has(column.propertyPath))
        )
            return undefined
        const names = columns.map((column) =>
            parameters.get(column.propertyPath)!,
        )
        return {
            values: names.map((name) => this.expressionMap.parameters[name]),
            parameters: names.map((name) => `:${name}`),
        }
    }

    /**
     * Resolve database equality over the captured rows, not a later table snapshot.
     *
     * @param rows Captured rows, including rows already matched to another input.
     * @param unmatched Ordinals of inputs that could not be matched in memory.
     * @param boundIds Original bound primary values and parameter references.
     * @param getEntityPredicates Lazily renders predicates for the original parameters.
     * @param matchedRows Receives the matched rows at their original input ordinals.
     */
    protected async matchReturnedRows(
        rows: ObjectLiteral[],
        unmatched: number[],
        boundIds: (BoundPrimaryKey | undefined)[],
        getEntityPredicates: () => string[],
        matchedRows: (ObjectLiteral | undefined)[],
    ): Promise<void> {
        const metadata = this.expressionMap.mainAlias!.metadata
        const driver = this.queryRunner.dataSource.driver
        const columns = metadata.primaryColumns
        const isPostgresFamily = DriverUtils.isPostgresFamily(driver)
        const isOracle = driver.options.type === "oracle"
        const isSqlServer = driver.options.type === "mssql"
        const escape = (name: string) => driver.escape(name)
        const table = metadata.tablePath
            .split(".")
            .map((part) => (part === "" ? part : escape(part)))
            .join(".")
        const names = columns.map((column) => escape(column.databaseName))
        const anchors = names.map(
            (name) => `(SELECT ${name} FROM ${table} WHERE 1 = 0)`,
        )
        let ordinal = "__typeorm_row_index"
        while (
            columns.some(
                (column) =>
                    column.databaseName.toLowerCase() === ordinal.toLowerCase(),
            )
        )
            ordinal += "_"
        const ordinalName = ordinal
        ordinal = escape(ordinal)
        let entityOrdinalName = "__typeorm_entity_index"
        while (
            columns.some(
                (column) =>
                    column.databaseName.toLowerCase() ===
                    entityOrdinalName.toLowerCase(),
            )
        )
            entityOrdinalName += "_"
        const entityOrdinal = escape(entityOrdinalName)
        let returnedTable = "typeorm_returned_rows"
        while (metadata.tableName.toLowerCase() === returnedTable.toLowerCase())
            returnedTable += "_"
        returnedTable = escape(returnedTable)
        // Split the bind budget between captured rows and input predicates.
        const budget = isSqlServer ? 2000 : 30000
        const maxOracleRows = 1000
        // Oracle's input strings must retain their original VARCHAR2 bind type.
        // CHAR and explicitly typed binds still need the original predicates.
        const oracleStringKeys =
            isOracle &&
            columns.every((column) =>
                ["varchar", "varchar2"].includes(driver.normalizeType(column)),
            ) &&
            unmatched.every((index) =>
                boundIds[index]?.values.every(
                    (value) => typeof value === "string",
                ),
            )
        const useJoin =
            (isPostgresFamily || oracleStringKeys) &&
            unmatched.every((index) => boundIds[index] !== undefined)
        const predicates = useJoin ? [] : getEntityPredicates()
        let maxPredicateParameters = columns.length * (isOracle ? 3 : 1)
        if (!useJoin) {
            for (const index of unmatched) {
                if (boundIds[index]) continue
                const [, values] = driver.escapeQueryWithParameters(
                    predicates[index],
                    this.expressionMap.parameters,
                )
                maxPredicateParameters = Math.max(
                    maxPredicateParameters,
                    values.length,
                )
            }
        }
        // SQL Server's sp_executesql request also uses two parameters internally.
        const parameterLimit = isSqlServer ? 2098 : 65535
        const rowParameterBudget = useJoin
            ? budget / 2
            : Math.min(budget / 2, parameterLimit - maxPredicateParameters)
        if (rowParameterBudget < columns.length)
            throw new TypeORMError(
                "Cannot match returned rows: the entity predicate leaves no parameters for its primary key.",
            )
        const rowChunkSize = Math.min(
            isOracle ? maxOracleRows : Infinity,
            Math.floor(rowParameterBudget / columns.length),
        )
        const maxUnionBranches = 100
        const inputChunkSize = useJoin
            ? rowChunkSize
            : Math.min(
                  isSqlServer ? rowChunkSize : maxUnionBranches,
                  Math.max(
                      1,
                      Math.floor(budget / (2 * maxPredicateParameters)),
                  ),
              )

        for (
            let rowOffset = 0;
            rowOffset < rows.length;
            rowOffset += rowChunkSize
        ) {
            const rowChunk = rows.slice(rowOffset, rowOffset + rowChunkSize)
            for (
                let inputOffset = 0;
                inputOffset < unmatched.length;
                inputOffset += inputChunkSize
            ) {
                const inputChunk = unmatched.slice(
                    inputOffset,
                    inputOffset + inputChunkSize,
                )
                const parameters = { ...this.expressionMap.parameters }
                let parameterIndex = 0
                const bind = (value: unknown): string => {
                    let name: string
                    do {
                        name = `typeorm_returned_${parameterIndex++}`
                    } while (name in parameters)
                    parameters[name] = value
                    return `:${name}`
                }
                const returnedValues = rowChunk.map((row, index) => {
                    const values = columns.map((column, columnIndex) => {
                        const parameter = bind(row[column.databaseName])
                        if (
                            isOracle ||
                            (isSqlServer && column.type !== "sql_variant")
                        )
                            return parameter
                        if (isPostgresFamily && index > 0) return parameter
                        const coalesce =
                            driver.options.type === "mssql"
                                ? "ISNULL"
                                : "COALESCE"
                        return `${coalesce}(${anchors[columnIndex]}, ${parameter})`
                    })
                    return (useJoin && !isOracle) || isSqlServer
                        ? `(${rowOffset + index}, ${values.join(", ")})`
                        : `SELECT ${rowOffset + index} AS ${ordinal}, ${values.map((value, columnIndex) => `${value} AS ${names[columnIndex]}`).join(", ")}${isOracle ? " FROM DUAL" : ""}`
                })
                let sql: string
                if (useJoin) {
                    const inputValues = inputChunk.map((entityIndex, index) => {
                        const values = boundIds[entityIndex]!.values.map(
                            (value, columnIndex) => {
                                const parameter = bind(value)
                                return !isOracle && index === 0
                                    ? `COALESCE(${anchors[columnIndex]}, ${parameter})`
                                    : parameter
                            },
                        )
                        return isOracle
                            ? `SELECT ${entityIndex} AS ${entityOrdinal}, ${values.map((value, columnIndex) => `${value} AS ${names[columnIndex]}`).join(", ")} FROM DUAL`
                            : `(${entityIndex}, ${values.join(", ")})`
                    })
                    const returnedSource = isOracle
                        ? `(SELECT raw_rows.${ordinal}, ${names.map((name, index) => `NVL(${anchors[index]}, raw_rows.${name}) AS ${name}`).join(", ")} FROM (${returnedValues.join(" UNION ALL ")}) raw_rows) returned`
                        : `(VALUES ${returnedValues.join(", ")}) AS returned(${ordinal}, ${names.join(", ")})`
                    const inputSource = isOracle
                        ? `(${inputValues.join(" UNION ALL ")}) input`
                        : `(VALUES ${inputValues.join(", ")}) AS input(${entityOrdinal}, ${names.join(", ")})`
                    sql =
                        `SELECT input.${entityOrdinal}, returned.${ordinal} FROM ` +
                        `${returnedSource} JOIN ${inputSource} ON ` +
                        names
                            .map((name) => `returned.${name} = input.${name}`)
                            .join(" AND ")
                } else if (isPostgresFamily) {
                    sql =
                        `WITH ${returnedTable} AS (${returnedValues.join(" UNION ALL ")}) ` +
                        inputChunk
                            .map(
                                (index) =>
                                    `SELECT ${index} AS ${entityOrdinal}, ${ordinal} FROM ${returnedTable} WHERE ${predicates[index]}`,
                            )
                            .join(" UNION ALL ")
                } else {
                    const matchingFlag = escape("__typeorm_match")
                    const comparisons = inputChunk.map((index) => {
                        const predicate =
                            isOracle && boundIds[index]
                                ? this.getOracleEntityPredicate(
                                      boundIds[index]!,
                                      names,
                                  )
                                : predicates[index]
                        const matches = `CASE WHEN ${predicate} THEN 1 ELSE 0 END`
                        return isOracle
                            ? `SELECT ${index} AS ${entityOrdinal}, ${matches} AS ${matchingFlag} FROM DUAL`
                            : `(${index}, ${matches})`
                    })
                    const matchingRows = isOracle
                        ? `(${comparisons.join(" UNION ALL ")}) matches`
                        : `(VALUES ${comparisons.join(", ")}) matches(${entityOrdinal}, ${matchingFlag})`
                    // Reference the captured rows once: repeating the CTE per input
                    // can expand SQL Server's compilation plan quadratically.
                    const rawSource = isSqlServer
                        ? `(VALUES ${returnedValues.join(", ")}) raw_rows(${ordinal}, ${names.join(", ")})`
                        : `(${returnedValues.join(" UNION ALL ")}) raw_rows`
                    const projection = names
                        .map((name, index) =>
                            isSqlServer && columns[index].type === "sql_variant"
                                ? `raw_rows.${name} AS ${name}`
                                : `${isOracle ? "NVL" : "ISNULL"}(${anchors[index]}, raw_rows.${name}) AS ${name}`,
                        )
                        .join(", ")
                    const returnedSource = `(SELECT raw_rows.${ordinal}, ${projection} FROM ${rawSource}) returned`
                    sql =
                        `SELECT matches.${entityOrdinal}, returned.${ordinal} FROM ${returnedSource} ` +
                        `CROSS APPLY ${matchingRows} WHERE matches.${matchingFlag} = 1`
                }
                const [query, values] = driver.escapeQueryWithParameters(
                    sql,
                    parameters,
                )
                const matches = await this.queryRunner.query(query, values)
                for (const match of matches) {
                    matchedRows[match[entityOrdinalName]] =
                        rows[match[ordinalName]]
                }
            }
        }
    }

    /**
     * Preserve Oracle's blank-padded equality after NVL widens CHAR to VARCHAR2.
     *
     * @param key Original bound primary values and parameter references.
     * @param columns Escaped primary column names in the captured rows.
     * @returns Positive equality predicates with the original padding semantics.
     */
    protected getOracleEntityPredicate(
        key: BoundPrimaryKey,
        columns: string[],
    ): string {
        const metadata = this.expressionMap.mainAlias!.metadata
        const oracle = (this.queryRunner.dataSource.driver as OracleDriver)
            .oracle
        return key.parameters
            .map((parameter, index) => {
                const type = metadata.primaryColumns[index].type
                const value = key.values[index] as { type?: unknown } | null
                if (
                    (type === "char" || type === "nchar") &&
                    value &&
                    (value.type === oracle.DB_TYPE_CHAR ||
                        value.type === oracle.DB_TYPE_NCHAR)
                ) {
                    const left = `RTRIM(${columns[index]})`
                    const right = `RTRIM(${parameter})`
                    // Empty strings are NULL in Oracle, but a space-only CHAR key is valid.
                    return `(${parameter} IS NOT NULL AND (${left} = ${right} OR (${left} IS NULL AND ${right} IS NULL)))`
                }
                return `${columns[index]} = ${parameter}`
            })
            .join(" AND ")
    }
}
