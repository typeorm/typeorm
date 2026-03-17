import type { API, FileInfo } from "jscodeshift"

/**
 * Renames .printSql() to .logQuery() on QueryBuilder.
 */
export const renamePrintSqlToLogQuery = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: "printSql" },
        },
    }).forEach((path) => {
        if (
            path.node.callee.type === "MemberExpression" &&
            path.node.callee.property.type === "Identifier"
        ) {
            path.node.callee.property.name = "logQuery"
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default renamePrintSqlToLogQuery
