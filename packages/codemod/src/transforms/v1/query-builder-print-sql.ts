import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `printSql()` for manual migration to `getSql()` / `getQueryAndParameters()`"
export const manual = true

export const queryBuilderPrintSql = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    const message =
        "`printSql()` was removed — use `getSql()` or `getQueryAndParameters()` to inspect SQL"

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: "printSql" },
        },
    }).forEach((callPath) => {
        // Walk up to the enclosing statement (ExpressionStatement or
        // VariableDeclaration). If we reach the root without finding one,
        // leave the file untouched — attaching a comment to a non-statement
        // node is usually dropped by recast, and `hasChanges = true` with no
        // actual edit would misreport the transform as having emitted a comment.
        let current = callPath.parent
        while (current) {
            const node: Node = current.node
            if (
                node.type === "ExpressionStatement" ||
                node.type === "VariableDeclaration"
            ) {
                if (!hasTodoComment(node, message)) {
                    addTodoComment(node, message, j)
                }
                hasChanges = true
                hasTodos = true
                return
            }
            current = current.parent
        }
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = queryBuilderPrintSql
export default fn
