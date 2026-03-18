import type { API, FileInfo } from "jscodeshift"
import { addTodoComment, reportTodo } from "../todo"

export const description = "replace removed `stats()` with TODO comment"
export const manual = true

export const replaceMongodbStats = (file: FileInfo, api: API) => {
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
        // Check if this is a statement expression we can add a comment before
        const parent = path.parent
        if (parent.node.type === "ExpressionStatement") {
            addTodoComment(parent.node, message, j)
            hasChanges = true
            hasTodos = true
        } else if (parent.node.type === "AwaitExpression") {
            const grandparent = path.parent.parent
            if (grandparent.node.type === "ExpressionStatement") {
                addTodoComment(grandparent.node, message, j)
                hasChanges = true
                hasTodos = true
            } else {
                // Nested in an expression — add comment to the call itself
                addTodoComment(path.node, message, j)
                hasChanges = true
                hasTodos = true
            }
        } else {
            // Nested in an expression — add comment to the call itself
            addTodoComment(path.node, message, j)
            hasChanges = true
            hasTodos = true
        }
    })

    if (hasTodos) reportTodo("replace-mongodb-stats", file, api)

    return hasChanges ? root.toSource() : undefined
}

export default replaceMongodbStats
