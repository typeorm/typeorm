import type { API, FileInfo } from "jscodeshift"
import { reportTodo } from "../todo"

export const description =
    "replace removed `getAllMigrations()` with TODO comment"
export const manual = true

export const renameGetAllMigrations = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: "getAllMigrations" },
        },
    }).forEach((path) => {
        // Add a TODO comment before the statement
        const statement = j(path).closest(j.ExpressionStatement)
        if (statement.length > 0) {
            statement.forEach((stmtPath) => {
                stmtPath.node.comments = stmtPath.node.comments || []
                stmtPath.node.comments.push(
                    j.commentLine(
                        " TODO: getAllMigrations() was removed in TypeORM v1. Use getPendingMigrations(), getExecutedMigrations(), or dataSource.migrations instead.",
                        true,
                    ),
                )
            })
        }
        hasChanges = true
    })

    if (hasChanges) reportTodo("rename-get-all-migrations", file, api)

    return hasChanges ? root.toSource() : undefined
}

export default renameGetAllMigrations
