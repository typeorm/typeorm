import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `getAllMigrations()` for manual migration"
export const manual = true

const todoAttachmentTypes = new Set([
    "ExpressionStatement",
    "VariableDeclaration",
    "ReturnStatement",
    "ClassProperty",
    "ExportDefaultDeclaration",
])

export const migrationsGetAll = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    const message =
        "`getAllMigrations()` was removed — use `getPendingMigrations()`, `getExecutedMigrations()`, or `dataSource.migrations` instead"

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: "getAllMigrations" },
        },
    }).forEach((path) => {
        // Walk up to find a statement-like ancestor to attach the TODO to.
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

export const fn = migrationsGetAll
export default fn
