import { PlatformTools } from "../platform/PlatformTools"

/**
 * Builds a SHA-256 checksum from the migration name plus generated SQL
 * (Flyway/Liquibase-style), not JavaScript `Function.toString()`.
 *
 * Line endings are normalized to `\n` so Windows and Unix produce the same hash.
 *
 * @param name
 * @param sqlStatements
 */
export function computeMigrationChecksum(
    name: string,
    sqlStatements: string[],
): string {
    const normalizedSql = sqlStatements
        .map((sql) => normalizeSql(sql))
        .filter((sql) => sql.length > 0)
        .join("\n")
    return PlatformTools.sha256(`${name}\0${normalizedSql}`)
}

/**
 * Normalizes generated SQL for a stable, cross-platform checksum.
 *
 * @param sql
 */
export function normalizeSql(sql: string): string {
    return sql.replaceAll("\r\n", "\n").trim()
}

/**
 * Serializes a SQL string plus its bound parameters for checksum input.
 *
 * @param query
 * @param parameters
 */
export function formatSqlForChecksum(
    query: string,
    parameters?: unknown,
): string {
    const sql = normalizeSql(query)
    if (parameters === undefined || parameters === null) {
        return sql
    }
    return `${sql}\0${stringifyChecksumParameters(parameters)}`
}

/**
 * Serializes bound query parameters for checksum input; falls back when
 * JSON.stringify fails on non-serializable values.
 *
 * @param parameters
 */
function stringifyChecksumParameters(parameters: unknown): string {
    try {
        return JSON.stringify(parameters)
    } catch {
        return Object.prototype.toString.call(parameters)
    }
}

/**
 * SQL text for logs/errors, with bound parameters stripped so checksum
 * diagnostics do not leak query values.
 *
 * @param sqlStatements
 */
export function sqlStatementsForDisplay(sqlStatements: string[]): string {
    return sqlStatements
        .map((statement) => statement.split("\0")[0] ?? "")
        .map((sql) => normalizeSql(sql))
        .filter((sql) => sql.length > 0)
        .join("\n")
}
