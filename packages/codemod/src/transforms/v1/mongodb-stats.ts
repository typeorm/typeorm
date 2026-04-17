import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "flag removed `stats()` for manual migration"
export const manual = true

export const mongodbStats = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    const message = "`stats()` was removed — use the MongoDB driver directly"

    // Find .stats() calls
    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "stats" },
        },
    }).forEach((path) => {
        const parentNode: Node = path.parent.node
        let target: Node = path.node
        if (parentNode.type === "ExpressionStatement") {
            target = parentNode
        } else if (parentNode.type === "AwaitExpression") {
            const grandparentNode: Node = path.parent.parent.node
            if (grandparentNode.type === "ExpressionStatement") {
                target = grandparentNode
            }
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

export const fn = mongodbStats
export default fn
