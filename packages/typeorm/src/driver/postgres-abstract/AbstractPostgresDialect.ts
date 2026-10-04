import type { ObjectLiteral } from "../../common/ObjectLiteral"
import type { ColumnMetadata } from "../../metadata/ColumnMetadata"
import type { EntityMetadata } from "../../metadata/EntityMetadata"
import type { Table } from "../../schema-builder/table/Table"
import type { TableForeignKey } from "../../schema-builder/table/TableForeignKey"
import type { View } from "../../schema-builder/view/View"
import { InstanceChecker } from "../../util/InstanceChecker"
import type { ReturningType } from "../types/ReturningType"

/** Shared PostgreSQL-family SQL helpers, independent of native clients. */
export abstract class AbstractPostgresDialect {
    abstract database?: string
    abstract schema?: string
    abstract parametersPrefix: string

    /**
     * Replaces parameters in the given sql with special escaping character
     * and an array of parameter names to be passed to a query.
     *
     * @param sql
     * @param parameters
     */
    escapeQueryWithParameters(
        sql: string,
        parameters: ObjectLiteral,
    ): [string, any[]] {
        const escapedParameters: any[] = []
        if (!parameters || !Object.keys(parameters).length)
            return [sql, escapedParameters]

        const parameterIndexMap = new Map<string, number>()
        sql = sql.replaceAll(
            /:(\.\.\.)?([A-Za-z0-9_.]+)/g,
            (full, isArray: string, key: string): string => {
                if (!parameters.hasOwnProperty(key)) {
                    return full
                }

                if (parameterIndexMap.has(key)) {
                    return this.parametersPrefix + parameterIndexMap.get(key)
                }

                const value: any = parameters[key]

                if (isArray) {
                    return value
                        .map((v: any) => {
                            escapedParameters.push(v)
                            return this.createParameter(
                                key,
                                escapedParameters.length - 1,
                            )
                        })
                        .join(", ")
                }

                if (typeof value === "function") {
                    return value()
                }

                escapedParameters.push(value)
                parameterIndexMap.set(key, escapedParameters.length)
                return this.createParameter(key, escapedParameters.length - 1)
            },
        )
        return [sql, escapedParameters]
    }

    /**
     * Escapes a column name.
     *
     * @param columnName
     */
    escape(columnName: string): string {
        return `"${columnName.replaceAll('"', '""')}"`
    }

    /**
     * Build full table name with schema name and table name.
     * E.g. myDB.mySchema.myTable
     *
     * @param tableName
     * @param schema
     */
    buildTableName(tableName: string, schema?: string): string {
        const tablePath = [tableName]

        if (schema) {
            tablePath.unshift(schema)
        }

        return tablePath.join(".")
    }

    /**
     * Parse a target table name or other types and return a normalized table definition.
     *
     * @param target
     */
    parseTableName(
        target: EntityMetadata | Table | View | TableForeignKey | string,
    ): { database?: string; schema?: string; tableName: string } {
        const driverDatabase = this.database
        const driverSchema = this.schema

        if (InstanceChecker.isTable(target) || InstanceChecker.isView(target)) {
            const parsed = this.parseTableName(target.name)

            return {
                database: target.database ?? parsed.database ?? driverDatabase,
                schema: target.schema ?? parsed.schema ?? driverSchema,
                tableName: parsed.tableName,
            }
        }

        if (InstanceChecker.isTableForeignKey(target)) {
            const parsed = this.parseTableName(target.referencedTableName)

            return {
                database:
                    target.referencedDatabase ??
                    parsed.database ??
                    driverDatabase,
                schema:
                    target.referencedSchema ?? parsed.schema ?? driverSchema,
                tableName: parsed.tableName,
            }
        }

        if (InstanceChecker.isEntityMetadata(target)) {
            // EntityMetadata tableName is never a path

            return {
                database: target.database ?? driverDatabase,
                schema: target.schema ?? driverSchema,
                tableName: target.tableName,
            }
        }

        const parts = target.split(".")

        return {
            database: driverDatabase,
            schema: (parts.length > 1 ? parts[0] : undefined) ?? driverSchema,
            tableName: parts.length > 1 ? parts[1] : parts[0],
        }
    }

    /**
     * Normalizes "isUnique" value of the column.
     *
     * @param column
     */
    normalizeIsUnique(column: ColumnMetadata): boolean {
        return column.entityMetadata.uniques.some(
            (uq) => uq.columns.length === 1 && uq.columns[0] === column,
        )
    }

    /**
     * Returns default column lengths, which is required on column creation.
     *
     * @param column
     */
    getColumnLength(column: ColumnMetadata): string {
        return column.length ? column.length.toString() : ""
    }

    protected lowerDefaultValueIfNecessary(value: string | undefined) {
        // Postgres saves function calls in default value as lowercase #2733
        if (!value) {
            return value
        }
        return value
            .split(`'`)
            .map((v, i) => {
                return i % 2 === 1 ? v : v.toLowerCase()
            })
            .join(`'`)
    }

    /**
     * Returns true if driver supports RETURNING / OUTPUT statement.
     *
     * @param _returningType
     */
    isReturningSqlSupported(_returningType: ReturningType): boolean {
        return true
    }

    /**
     * Returns true if driver supports uuid values generation on its own.
     */
    isUUIDGenerationSupported(): boolean {
        return true
    }

    /**
     * Returns true if driver supports fulltext indices.
     */
    isFullTextColumnTypeSupported(): boolean {
        return false
    }

    /**
     * Creates an escaped parameter.
     *
     * @param parameterName
     * @param index
     */
    createParameter(parameterName: string, index: number): string {
        return this.parametersPrefix + (index + 1)
    }
}
