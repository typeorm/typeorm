import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `printSql()` for manual migration to `getSql()` / `getQueryAndParameters()`"
export const manual = true

export const queryBuilderPrintSql = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    const message =
        "`printSql()` was removed — use `getSql()` or `getQueryAndParameters()` to inspect SQL"

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

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = queryBuilderPrintSql
export default fn
