import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `getAllMigrations()` for manual migration"
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
                    "`getAllMigrations()` was removed — use `getPendingMigrations()`, `getExecutedMigrations()`, or `dataSource.migrations` instead",
                    j,
                )
            })
        }
        hasChanges = true
    })

    if (hasChanges) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = migrationsGetAll
export default fn
