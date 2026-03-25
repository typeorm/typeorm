import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { addTodoComment, reportTodo } from "../todo"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "replace removed `stats()` with TODO comment"
export const manual = true

export const mongodbStats = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    const message =
        "`stats()` was removed in TypeORM v1. Use the MongoDB driver directly. See migration guide: https://typeorm.io/docs/guides/migration-v1"

    // Find .stats() calls
    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "stats" },
        },
    }).forEach((path) => {
        const parentNode: Node = path.parent.node
        if (parentNode.type === "ExpressionStatement") {
            addTodoComment(parentNode, message, j)
        } else if (parentNode.type === "AwaitExpression") {
            const grandparentNode: Node = path.parent.parent.node
            if (grandparentNode.type === "ExpressionStatement") {
                addTodoComment(grandparentNode, message, j)
            } else {
                addTodoComment(path.node, message, j)
            }
        } else {
            addTodoComment(path.node, message, j)
        }
        hasChanges = true
        hasTodos = true
    })

    if (hasTodos) reportTodo(name, file, api)

    return hasChanges ? root.toSource() : undefined
}

export const fn = mongodbStats
export default fn
