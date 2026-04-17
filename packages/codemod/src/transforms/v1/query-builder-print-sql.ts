import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `printSql()` for manual migration to `getSql()` / `getQueryAndParameters()`"
export const manual = true

const todoAttachmentTypes = new Set([
    "ExpressionStatement",
    "VariableDeclaration",
    "ReturnStatement",
    "ClassProperty",
    "ExportDefaultDeclaration",
])

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
    }).forEach((path) => {
        // Walk up to find the enclosing statement-like ancestor.
        let target: Node = path.node
        let current = path.parent
        while (current) {
            const node: Node = current.node
            if (todoAttachmentTypes.has(node.type)) {
                target = node
                break
            }
            current = current.parent
        }
        if (!hasTodoComment(target, message)) {
            addTodoComment(target, message, j)
            hasTodos = true
        }
        hasChanges = true
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = queryBuilderPrintSql
export default fn
