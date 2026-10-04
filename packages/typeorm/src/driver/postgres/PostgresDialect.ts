import type { ObjectLiteral } from "../../common/ObjectLiteral"
import type { DataSource } from "../../data-source/DataSource"
import { TypeORMError } from "../../error"
import type { ColumnMetadata } from "../../metadata/ColumnMetadata"
import type { EntityMetadata } from "../../metadata/EntityMetadata"
import type { IndexMetadata } from "../../metadata/IndexMetadata"
import type { TableIndexTypes } from "../../schema-builder/options/TableIndexTypes"
import type { TableColumn } from "../../schema-builder/table/TableColumn"
import type { TableIndex } from "../../schema-builder/table/TableIndex"
import { ApplyValueTransformers } from "../../util/ApplyValueTransformers"
import { DateUtils } from "../../util/DateUtils"
import { OrmUtils } from "../../util/OrmUtils"
import type { ColumnType } from "../types/ColumnTypes"
import type { CteCapabilities } from "../types/CteCapabilities"
import type { DataTypeDefaults } from "../types/DataTypeDefaults"
import type { MappedColumnTypes } from "../types/MappedColumnTypes"
import type { IsolationLevel } from "../types/IsolationLevel"
import type { UpsertType } from "../types/UpsertType"
import type { PostgresDataSourceOptions } from "./PostgresDataSourceOptions"
import { AbstractPostgresDialect } from "../postgres-abstract/AbstractPostgresDialect"

/** PostgreSQL SQL, value conversion and schema capabilities, independent of its client. */
export abstract class PostgresDialect extends AbstractPostgresDialect {
    abstract dataSource: DataSource
    abstract options: PostgresDataSourceOptions

    // -------------------------------------------------------------------------
    // Static Properties
    // -------------------------------------------------------------------------

    /**
     * Transaction isolation levels supported by this driver.
     *
     * @see https://www.postgresql.org/docs/current/transaction-iso.html
     */
    static readonly supportedIsolationLevels: IsolationLevel[] = [
        "READ UNCOMMITTED",
        "READ COMMITTED",
        "REPEATABLE READ",
        "SERIALIZABLE",
    ]

    /**
     * Isolation levels supported by this driver.
     */
    supportedIsolationLevels = PostgresDialect.supportedIsolationLevels

    /**
     * Indicates if tree tables are supported by this driver.
     */
    treeSupport = true

    /**
     * Represent transaction support by this driver
     */
    transactionSupport = "nested" as const

    /**
     * Gets list of supported column data types by a driver.
     *
     * @see https://www.postgresql.org/docs/current/datatype.html
     */
    supportedDataTypes: ColumnType[] = [
        "int",
        "int2",
        "int4",
        "int8",
        "smallint",
        "integer",
        "bigint",
        "decimal",
        "numeric",
        "real",
        "float",
        "float4",
        "float8",
        "double precision",
        "money",
        "character varying",
        "varchar",
        "character",
        "char",
        "text",
        "citext",
        "hstore",
        "bytea",
        "bit",
        "varbit",
        "bit varying",
        "timetz",
        "timestamptz",
        "timestamp",
        "timestamp without time zone",
        "timestamp with time zone",
        "date",
        "time",
        "time without time zone",
        "time with time zone",
        "interval",
        "bool",
        "boolean",
        "enum",
        "point",
        "line",
        "lseg",
        "box",
        "path",
        "polygon",
        "circle",
        "cidr",
        "inet",
        "macaddr",
        "macaddr8",
        "tsvector",
        "tsquery",
        "uuid",
        "xml",
        "json",
        "jsonb",
        "jsonpath",
        "int4range",
        "int8range",
        "numrange",
        "tsrange",
        "tstzrange",
        "daterange",
        "int4multirange",
        "int8multirange",
        "nummultirange",
        "tsmultirange",
        "tstzmultirange",
        "datemultirange",
        "geometry",
        "geography",
        "cube",
        "ltree",
        "vector",
        "halfvec",
    ]

    /**
     * Returns type of upsert supported by driver if any
     */
    supportedUpsertTypes: UpsertType[] = ["on-conflict-do-update"]

    /**
     * Gets list of spatial column data types.
     */
    spatialTypes: ColumnType[] = ["geometry", "geography"]

    /**
     * Gets list of column data types that support length by a driver.
     */
    withLengthColumnTypes: ColumnType[] = [
        "character varying",
        "varchar",
        "character",
        "char",
        "bit",
        "varbit",
        "bit varying",
        "vector",
        "halfvec",
    ]

    /**
     * Gets list of column data types that support precision by a driver.
     */
    withPrecisionColumnTypes: ColumnType[] = [
        "numeric",
        "decimal",
        "interval",
        "time without time zone",
        "time with time zone",
        "timestamp without time zone",
        "timestamp with time zone",
    ]

    /**
     * Gets list of column data types that support scale by a driver.
     */
    withScaleColumnTypes: ColumnType[] = ["numeric", "decimal"]

    /**
     * Orm has special columns and we need to know what database column types should be for those types.
     * Column types are driver dependant.
     */
    mappedDataTypes: MappedColumnTypes = {
        createDate: "timestamp",
        createDateDefault: "now()",
        updateDate: "timestamp",
        updateDateDefault: "now()",
        deleteDate: "timestamp",
        deleteDateNullable: true,
        version: "int4",
        treeLevel: "int4",
        migrationId: "int4",
        migrationName: "varchar",
        migrationTimestamp: "int8",
        cacheId: "int4",
        cacheIdentifier: "varchar",
        cacheTime: "int8",
        cacheDuration: "int4",
        cacheQuery: "text",
        cacheResult: "text",
        metadataType: "varchar",
        metadataDatabase: "varchar",
        metadataSchema: "varchar",
        metadataTable: "varchar",
        metadataName: "varchar",
        metadataValue: "text",
    }

    /**
     * Table indices supported
     */
    supportedIndexTypes: TableIndexTypes[] = [
        "brin",
        "btree",
        "gin",
        "gist",
        "hash",
        "spgist",
    ]

    /**
     * The prefix used for the parameters
     */
    parametersPrefix: string = "$"

    /**
     * Default values of length, precision and scale depends on column data type.
     * Used in the cases when length/precision/scale is not specified by user.
     */
    dataTypeDefaults: DataTypeDefaults = {
        character: { length: 1 },
        bit: { length: 1 },
        interval: { precision: 6 },
        "time without time zone": { precision: 6 },
        "time with time zone": { precision: 6 },
        "timestamp without time zone": { precision: 6 },
        "timestamp with time zone": { precision: 6 },
    }

    /**
     * Max length allowed by Postgres for aliases.
     *
     * @see https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
     */
    maxAliasLength = 63

    isGeneratedColumnsSupported: boolean = false

    cteCapabilities: CteCapabilities = {
        enabled: true,
        writable: true,
        requiresRecursiveHint: true,
        materializedHint: true,
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type and metadata.
     *
     * @param value
     * @param columnMetadata
     */
    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(
                columnMetadata.transformer,
                value,
            )

        if (value === null || value === undefined) return value

        if (columnMetadata.type === Boolean) {
            return value === true ? 1 : 0
        } else if (columnMetadata.type === "date") {
            return DateUtils.mixedDateToDateString(value, {
                utc: columnMetadata.utc,
            })
        } else if (columnMetadata.type === "time") {
            return DateUtils.mixedDateToTimeString(value)
        } else if (
            columnMetadata.type === "datetime" ||
            columnMetadata.type === Date ||
            columnMetadata.type === "timestamp" ||
            columnMetadata.type === "timestamptz" ||
            columnMetadata.type === "timestamp with time zone" ||
            columnMetadata.type === "timestamp without time zone"
        ) {
            return DateUtils.mixedDateToDate(value)
        } else if (columnMetadata.type === "point") {
            if (
                typeof value === "object" &&
                value.x !== undefined &&
                value.y !== undefined
            ) {
                return `(${value.x},${value.y})`
            }
            return value
        } else if (columnMetadata.type === "circle") {
            if (
                typeof value === "object" &&
                value.x !== undefined &&
                value.y !== undefined &&
                value.radius !== undefined
            ) {
                return `<(${value.x},${value.y}),${value.radius}>`
            }
            return value
        } else if (
            ["json", "jsonb", ...this.spatialTypes].indexOf(
                columnMetadata.type,
            ) >= 0
        ) {
            return JSON.stringify(value)
        } else if (
            columnMetadata.type === "vector" ||
            columnMetadata.type === "halfvec"
        ) {
            if (Array.isArray(value)) {
                return `[${value.join(",")}]`
            } else {
                return value
            }
        } else if (columnMetadata.type === "hstore") {
            if (typeof value === "string") {
                return value
            } else {
                // https://www.postgresql.org/docs/9.0/hstore.html
                const quoteString = (value: unknown) => {
                    // If a string to be quoted is `null` or `undefined`, we return a literal unquoted NULL.
                    // This way, NULL values can be stored in the hstore object.
                    if (value === null || typeof value === "undefined") {
                        return "NULL"
                    }
                    // Convert non-null values to string since HStore only stores strings anyway.
                    // To include a double quote or a backslash in a key or value, escape it with a backslash.
                    return `"${`${value}`.replaceAll(/(?=["\\])/g, "\\")}"`
                }
                return Object.keys(value)
                    .map(
                        (key) =>
                            quoteString(key) + "=>" + quoteString(value[key]),
                    )
                    .join(",")
            }
        } else if (columnMetadata.type === "simple-array") {
            return DateUtils.simpleArrayToString(value)
        } else if (columnMetadata.type === "simple-json") {
            return DateUtils.simpleJsonToString(value)
        } else if (columnMetadata.type === "cube") {
            if (columnMetadata.isArray) {
                return `{${value
                    .map((cube: number[]) => `"(${cube.join(",")})"`)
                    .join(",")}}`
            }
            return `(${value.join(",")})`
        } else if (columnMetadata.type === "ltree") {
            return value
                .split(".")
                .filter(Boolean)
                .join(".")
                .replaceAll(/[\s]+/g, "_")
        } else if (
            (columnMetadata.type === "enum" ||
                columnMetadata.type === "simple-enum") &&
            !columnMetadata.isArray
        ) {
            return "" + value
        }

        return value
    }

    /**
     * Prepares given value to a value to be persisted, based on its column type or metadata.
     *
     * @param value
     * @param columnMetadata
     */
    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any {
        if (value === null || value === undefined)
            return columnMetadata.transformer
                ? ApplyValueTransformers.transformFrom(
                      columnMetadata.transformer,
                      value,
                  )
                : value

        if (columnMetadata.type === Boolean) {
            value = value ? true : false
        } else if (
            columnMetadata.type === "datetime" ||
            columnMetadata.type === Date ||
            columnMetadata.type === "timestamp" ||
            columnMetadata.type === "timestamptz" ||
            columnMetadata.type === "timestamp with time zone" ||
            columnMetadata.type === "timestamp without time zone"
        ) {
            value = DateUtils.normalizeHydratedDate(value)
        } else if (columnMetadata.type === "date") {
            value = DateUtils.mixedDateToDateString(value, {
                utc: columnMetadata.utc,
            })
        } else if (columnMetadata.type === "time") {
            value = DateUtils.mixedTimeToString(value)
        } else if (
            columnMetadata.type === "vector" ||
            columnMetadata.type === "halfvec"
        ) {
            if (
                typeof value === "string" &&
                value.startsWith("[") &&
                value.endsWith("]")
            ) {
                if (value === "[]") return []
                return value.slice(1, -1).split(",").map(Number)
            }
        } else if (columnMetadata.type === "hstore") {
            if (columnMetadata.hstoreType === "object") {
                const unescapeString = (str: string) =>
                    str.replaceAll(/\\./g, (m) => m[1])
                const regexp =
                    /"([^"\\]*(?:\\.[^"\\]*)*)"=>(?:(NULL)|"([^"\\]*(?:\\.[^"\\]*)*)")(?:,|$)/g
                const object: ObjectLiteral = {}
                ;`${value}`.replaceAll(
                    regexp,
                    (_, key, nullValue, stringValue) => {
                        object[unescapeString(key)] = nullValue
                            ? null
                            : unescapeString(stringValue)
                        return ""
                    },
                )
                value = object
            }
        } else if (columnMetadata.type === "simple-array") {
            value = DateUtils.stringToSimpleArray(value)
        } else if (columnMetadata.type === "simple-json") {
            value = DateUtils.stringToSimpleJson(value)
        } else if (columnMetadata.type === "cube") {
            value = value.replaceAll(/[()\s]+/g, "") // remove whitespace
            if (columnMetadata.isArray) {
                /**
                 * Strips these groups from `{"1,2,3","",NULL}`:
                 * 1. ["1,2,3", undefined]  <- cube of arity 3
                 * 2. ["", undefined]         <- cube of arity 0
                 * 3. [undefined, "NULL"]     <- NULL
                 */
                const regexp = /(?:"((?:[\d\s.,])*)")|(?:(NULL))/g
                const unparsedArrayString = value

                value = []
                let cube: RegExpExecArray | null
                // Iterate through all regexp matches for cubes/null in array
                while ((cube = regexp.exec(unparsedArrayString)) !== null) {
                    if (cube[1] !== undefined) {
                        value.push(
                            cube[1].split(",").filter(Boolean).map(Number),
                        )
                    } else {
                        value.push(undefined)
                    }
                }
            } else {
                value = value.split(",").filter(Boolean).map(Number)
            }
        } else if (
            columnMetadata.type === "enum" ||
            columnMetadata.type === "simple-enum"
        ) {
            if (columnMetadata.isArray) {
                if (value === "{}") return []

                // manually convert enum array to array of values (pg does not support, see https://github.com/brianc/node-pg-types/issues/56)
                value = (value as string)
                    .slice(1, -1)
                    .split(",")
                    .map((val) => {
                        // replace double quotes from the beginning and from the end
                        if (val.startsWith(`"`) && val.endsWith(`"`))
                            val = val.slice(1, -1)
                        // replace escaped backslash and double quotes
                        return val.replaceAll(/\\(\\|")/g, "$1")
                    })

                // convert to number if that exists in possible enum options
                value = value.map((val: string) => {
                    return !isNaN(+val) &&
                        columnMetadata.enum!.indexOf(parseInt(val)) >= 0
                        ? parseInt(val)
                        : val
                })
            } else {
                // convert to number if that exists in possible enum options
                value =
                    !isNaN(+value) &&
                    columnMetadata.enum!.indexOf(parseInt(value)) >= 0
                        ? parseInt(value)
                        : value
            }
        } else if (columnMetadata.type === Number) {
            // convert to number if number
            value = !isNaN(+value) ? parseInt(value) : value
        }

        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformFrom(
                columnMetadata.transformer,
                value,
            )
        return value
    }

    /**
     * Creates a database type from a given column metadata.
     *
     * @param column
     * @param column.type
     * @param column.length
     * @param column.precision
     * @param column.scale
     * @param column.isArray
     */
    normalizeType(column: {
        type?: ColumnType
        length?: number | string
        precision?: number | null
        scale?: number
        isArray?: boolean
    }): string {
        if (
            column.type === Number ||
            column.type === "int" ||
            column.type === "int4"
        ) {
            return "integer"
        } else if (column.type === String || column.type === "varchar") {
            return "character varying"
        } else if (column.type === Date || column.type === "timestamp") {
            return "timestamp without time zone"
        } else if (column.type === "timestamptz") {
            return "timestamp with time zone"
        } else if (column.type === "time") {
            return "time without time zone"
        } else if (column.type === "timetz") {
            return "time with time zone"
        } else if (column.type === Boolean || column.type === "bool") {
            return "boolean"
        } else if (column.type === "simple-array") {
            return "text"
        } else if (column.type === "simple-json") {
            return "text"
        } else if (column.type === "simple-enum") {
            return "enum"
        } else if (column.type === "int2") {
            return "smallint"
        } else if (column.type === "int8") {
            return "bigint"
        } else if (column.type === "decimal") {
            return "numeric"
        } else if (column.type === "float8" || column.type === "float") {
            return "double precision"
        } else if (column.type === "float4") {
            return "real"
        } else if (column.type === "char") {
            return "character"
        } else if (column.type === "varbit") {
            return "bit varying"
        } else {
            return (column.type as string) || ""
        }
    }

    /**
     * Normalizes "default" value of the column.
     *
     * @param columnMetadata
     */
    normalizeDefault(columnMetadata: ColumnMetadata): string | undefined {
        const defaultValue = columnMetadata.default

        if (defaultValue === null || defaultValue === undefined) {
            return undefined
        }

        if (columnMetadata.isArray && Array.isArray(defaultValue)) {
            return `'{${defaultValue.map((val) => String(val)).join(",")}}'`
        }

        if (typeof defaultValue === "function") {
            const value = defaultValue()

            return this.normalizeDatetimeFunction(value)
        }

        if (
            (columnMetadata.type === "enum" ||
                columnMetadata.type === "simple-enum" ||
                typeof defaultValue === "number" ||
                typeof defaultValue === "string") &&
            defaultValue !== undefined
        ) {
            return `'${defaultValue}'`
        }

        if (typeof defaultValue === "boolean") {
            return defaultValue ? "true" : "false"
        }

        if (typeof defaultValue === "object") {
            return `'${JSON.stringify(defaultValue).replaceAll("'", "''")}'`
        }

        return `${defaultValue}`
    }

    /**
     * Compares "default" value of the column.
     *
     * @param columnMetadata
     * @param tableColumn
     */
    private defaultEqual(
        columnMetadata: ColumnMetadata,
        tableColumn: TableColumn,
    ): boolean {
        // defaults are equal if both are undefined or null
        if (
            (columnMetadata.default === null ||
                columnMetadata.default === undefined) &&
            (tableColumn.default === null || tableColumn.default === undefined)
        )
            return true

        if (
            ["json", "jsonb"].includes(columnMetadata.type as string) &&
            !["function", "undefined"].includes(typeof columnMetadata.default)
        ) {
            return this.compareJsonDefaults(columnMetadata, tableColumn)
        }

        const columnDefault = this.lowerDefaultValueIfNecessary(
            this.normalizeDefault(columnMetadata),
        )
        return columnDefault === tableColumn.default
    }

    /**
     * Compares json/jsonb default values of the column.
     *
     * @param columnMetadata
     * @param tableColumn
     */
    private compareJsonDefaults(
        columnMetadata: ColumnMetadata,
        tableColumn: TableColumn,
    ): boolean {
        let jsonString = tableColumn.default
        if (typeof jsonString === "string") {
            jsonString = jsonString.trim()
            if (jsonString.startsWith("'") && jsonString.endsWith("'")) {
                jsonString = jsonString.slice(1, -1).replaceAll("''", "'")
            }
        }

        if (typeof jsonString === "string") {
            try {
                const tableColumnDefault = JSON.parse(jsonString)
                return OrmUtils.deepCompare(
                    columnMetadata.default,
                    tableColumnDefault,
                )
            } catch (err) {
                if (!(err instanceof SyntaxError)) {
                    throw new TypeORMError(
                        `Failed to compare default values of ${columnMetadata.propertyName} column`,
                    )
                }
            }
        } else {
            return OrmUtils.deepCompare(columnMetadata.default, jsonString)
        }
        return false
    }

    /**
     * Creates column type definition including length, precision and scale
     *
     * @param column
     */
    createFullType(column: TableColumn): string {
        let type = column.type

        if (column.length) {
            type += "(" + column.length + ")"
        } else if (
            column.precision !== null &&
            column.precision !== undefined &&
            column.scale !== null &&
            column.scale !== undefined
        ) {
            type += "(" + column.precision + "," + column.scale + ")"
        } else if (
            column.precision !== null &&
            column.precision !== undefined
        ) {
            type += "(" + column.precision + ")"
        }

        if (column.type === "time without time zone") {
            type =
                "TIME" +
                (column.precision !== null && column.precision !== undefined
                    ? "(" + column.precision + ")"
                    : "")
        } else if (column.type === "time with time zone") {
            type =
                "TIME" +
                (column.precision !== null && column.precision !== undefined
                    ? "(" + column.precision + ")"
                    : "") +
                " WITH TIME ZONE"
        } else if (column.type === "timestamp without time zone") {
            type =
                "TIMESTAMP" +
                (column.precision !== null && column.precision !== undefined
                    ? "(" + column.precision + ")"
                    : "")
        } else if (column.type === "timestamp with time zone") {
            type =
                "TIMESTAMP" +
                (column.precision !== null && column.precision !== undefined
                    ? "(" + column.precision + ")"
                    : "") +
                " WITH TIME ZONE"
        } else if (this.spatialTypes.indexOf(column.type as ColumnType) >= 0) {
            if (column.spatialFeatureType != null && column.srid != null) {
                type = `${column.type}(${column.spatialFeatureType},${column.srid})`
            } else if (column.spatialFeatureType != null) {
                type = `${column.type}(${column.spatialFeatureType})`
            } else {
                type = column.type
            }
        } else if (column.type === "vector" || column.type === "halfvec") {
            type =
                column.type + (column.length ? "(" + column.length + ")" : "")
        }

        if (column.isArray) type += " array"

        return type
    }

    /**
     * Creates generated map of values generated or returned by database after INSERT query.
     *
     * todo: slow. optimize Object.keys(), OrmUtils.mergeDeep and column.createValueMap parts
     *
     * @param metadata
     * @param insertResult
     */
    createGeneratedMap(metadata: EntityMetadata, insertResult: ObjectLiteral) {
        if (!insertResult) return undefined

        return Object.keys(insertResult).reduce((map, key) => {
            const column = metadata.findColumnWithDatabaseName(key)
            if (column) {
                OrmUtils.mergeDeep(
                    map,
                    column.createValueMap(insertResult[key]),
                )
            }
            return map
        }, {} as ObjectLiteral)
    }

    /**
     * Differentiate columns of this table and columns from the given column metadatas columns
     * and returns only changed.
     *
     * @param tableColumns
     * @param columnMetadatas
     */
    findChangedColumns(
        tableColumns: TableColumn[],
        columnMetadatas: ColumnMetadata[],
    ): ColumnMetadata[] {
        return columnMetadatas.filter((columnMetadata) => {
            const tableColumn = tableColumns.find(
                (c) => c.name === columnMetadata.databaseName,
            )
            if (!tableColumn) return false // we don't need new columns, we only need exist and changed

            const isColumnChanged =
                tableColumn.name !== columnMetadata.databaseName ||
                tableColumn.type !== this.normalizeType(columnMetadata) ||
                tableColumn.length !== columnMetadata.length ||
                tableColumn.isArray !== columnMetadata.isArray ||
                tableColumn.precision !== columnMetadata.precision ||
                (columnMetadata.scale !== undefined &&
                    tableColumn.scale !== columnMetadata.scale) ||
                tableColumn.comment !==
                    this.escapeComment(columnMetadata.comment) ||
                (!tableColumn.isGenerated &&
                    !this.defaultEqual(columnMetadata, tableColumn)) || // we included check for generated here, because generated columns already can have default values
                tableColumn.isPrimary !== columnMetadata.isPrimary ||
                tableColumn.isNullable !== columnMetadata.isNullable ||
                tableColumn.isUnique !==
                    this.normalizeIsUnique(columnMetadata) ||
                tableColumn.enumName !== columnMetadata.enumName ||
                !!(
                    tableColumn.enum &&
                    columnMetadata.enum &&
                    !OrmUtils.isArraysEqual(
                        tableColumn.enum,
                        columnMetadata.enum.map((val) => val + ""),
                    )
                ) || // enums in postgres are always strings
                tableColumn.isGenerated !== columnMetadata.isGenerated ||
                (tableColumn.spatialFeatureType ?? "").toLowerCase() !==
                    (columnMetadata.spatialFeatureType ?? "").toLowerCase() ||
                tableColumn.srid !== columnMetadata.srid ||
                tableColumn.generatedType !== columnMetadata.generatedType ||
                (tableColumn.asExpression ?? "").trim() !==
                    (columnMetadata.asExpression ?? "").trim() ||
                tableColumn.collation !== columnMetadata.collation

            return isColumnChanged
        })
    }

    get uuidGenerator(): string {
        return this.options.uuidExtension === "pgcrypto"
            ? "gen_random_uuid()"
            : "uuid_generate_v4()"
    }

    compareTableIndexTypes = (indexA: IndexMetadata, indexB: TableIndex) => {
        const normalizedA = indexA.isSpatial ? "gist" : (indexA.type ?? "btree")
        const normalizedB = indexB.isSpatial ? "gist" : (indexB.type ?? "btree")

        return normalizedA.toLowerCase() === normalizedB.toLowerCase()
    }

    /**
     * If parameter is a datetime function, e.g. "CURRENT_TIMESTAMP", normalizes it.
     * Otherwise returns original input.
     *
     * @param value
     */
    protected normalizeDatetimeFunction(value: string) {
        const match = value
            .trim()
            .toUpperCase()
            .match(
                /^(CURRENT_TIMESTAMP|CURRENT_DATE|CURRENT_TIME|LOCALTIMESTAMP|LOCALTIME)(\(\d+\))?$/,
            )

        if (!match) return value

        const [, funcName, precision = ""] = match

        const prefix = "('now'::text)"

        switch (funcName) {
            case "CURRENT_TIMESTAMP":
                return precision
                    ? `${prefix}::timestamp${precision} with time zone`
                    : "now()"
            case "CURRENT_DATE":
                return `${prefix}::date`
            case "CURRENT_TIME":
                return `${prefix}::time${precision} with time zone`
            case "LOCALTIMESTAMP":
                return `${prefix}::timestamp${precision} without time zone`
            case "LOCALTIME":
                return `${prefix}::time${precision} without time zone`
            default:
                return value
        }
    }

    /**
     * Escapes a given comment.
     *
     * @param comment
     */
    protected escapeComment(comment?: string) {
        if (!comment) return comment

        comment = comment.replaceAll("\u0000", "") // Null bytes aren't allowed in comments

        return comment
    }
}
