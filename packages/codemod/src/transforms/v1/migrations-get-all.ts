import type { API, FileInfo } from "jscodeshift"
import { addTodoComment, reportTodo } from "../todo"

export const description =
    "replace removed `getAllMigrations()` with TODO comment"
export const manual = true

export const migrationsGetAll = (file: FileInfo, api: API) => {
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
                addTodoComment(
                    stmtPath.node,
                    "getAllMigrations() was removed in TypeORM v1. Use getPendingMigrations(), getExecutedMigrations(), or dataSource.migrations instead.",
                    j,
                )
            })
        }
        hasChanges = true
    })

    if (hasChanges) reportTodo("rename-get-all-migrations", file, api)

    return hasChanges ? root.toSource() : undefined
}

export default migrationsGetAll
