import type { API, FileInfo, Node } from "jscodeshift"
import { addTodoComment, reportTodo } from "../todo"

export const description =
    "replace removed `printSql()` with `getSql()` or `getQueryAndParameters()`"
export const manual = true

export const queryBuilderPrintSql = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    const message =
        "`printSql()` was removed in TypeORM v1. Use `getSql()` or `getQueryAndParameters()` to inspect SQL. See migration guide: https://typeorm.io/docs/guides/migration-v1"

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: "printSql" },
        },
    }).forEach((path) => {
        // Walk up to find the enclosing ExpressionStatement
        let current = path.parent
        while (current) {
            const node: Node = current.node
            if (node.type === "ExpressionStatement") {
                addTodoComment(node, message, j)
                break
            }
            if (node.type === "VariableDeclaration") {
                addTodoComment(node, message, j)
                break
            }
            current = current.parent
        }
        hasChanges = true
        hasTodos = true
    })

    if (hasTodos) reportTodo("query-builder-print-sql", file, api)

    return hasChanges ? root.toSource() : undefined
}

export default queryBuilderPrintSql
