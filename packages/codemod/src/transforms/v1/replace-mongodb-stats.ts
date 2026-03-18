import type { API, FileInfo } from "jscodeshift"
import { reportTodo } from "../todo"

export const description = "replace removed `stats()` with TODO comment"
export const manual = true

export const replaceMongodbStats = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

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
            const comment = j.commentLine(
                " TODO: `stats()` was removed in TypeORM v1. Use the MongoDB driver directly. See migration guide: https://typeorm.io/docs/guides/migration-v1",
            )
            parent.node.comments = parent.node.comments || []
            parent.node.comments.push(comment)
            comment.leading = true
            hasChanges = true
            hasTodos = true
        } else if (parent.node.type === "AwaitExpression") {
            const grandparent = path.parent.parent
            if (grandparent.node.type === "ExpressionStatement") {
                const comment = j.commentLine(
                    " TODO: `stats()` was removed in TypeORM v1. Use the MongoDB driver directly. See migration guide: https://typeorm.io/docs/guides/migration-v1",
                )
                grandparent.node.comments = grandparent.node.comments || []
                grandparent.node.comments.push(comment)
                comment.leading = true
                hasChanges = true
                hasTodos = true
            } else {
                // Nested in an expression — add comment to the call itself
                const comment = j.commentLine(
                    " TODO: `stats()` was removed in TypeORM v1. Use the MongoDB driver directly. See migration guide: https://typeorm.io/docs/guides/migration-v1",
                )
                ;(path.node as any).comments = (path.node as any).comments || []
                ;(path.node as any).comments.push(comment)
                comment.leading = true
                hasChanges = true
                hasTodos = true
            }
        } else {
            // Nested in an expression — add comment to the call itself
            const comment = j.commentLine(
                " TODO: `stats()` was removed in TypeORM v1. Use the MongoDB driver directly. See migration guide: https://typeorm.io/docs/guides/migration-v1",
            )
            ;(path.node as any).comments = (path.node as any).comments || []
            ;(path.node as any).comments.push(comment)
            comment.leading = true
            hasChanges = true
            hasTodos = true
        }
    })

    if (hasTodos) reportTodo("replace-mongodb-stats", file, api)

    return hasChanges ? root.toSource() : undefined
}

export default replaceMongodbStats
