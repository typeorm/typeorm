import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `getAllMigrations()` for manual migration"
export const manual = true

const MESSAGE =
    "`getAllMigrations()` was removed — use `getPendingMigrations()`, `getExecutedMigrations()`, or `dataSource.migrations` instead"

// A TODO attached to one of these nodes will survive jscodeshift/recast's
// printing. Walking up until we reach one of these produces a visible
// comment above the enclosing statement or declaration.
const isTodoHost = (type: string): boolean =>
    type.endsWith("Statement") ||
    type === "VariableDeclaration" ||
    type === "ExportDefaultDeclaration" ||
    type === "ExportNamedDeclaration" ||
    type === "ClassProperty" ||
    type === "PropertyDefinition"

export const migrationsGetAll = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: "getAllMigrations" },
        },
    }).forEach((callPath) => {
        hasChanges = true
        let current = callPath.parent
        while (current) {
            const node: Node = current.node
            if (isTodoHost(node.type)) {
                if (!hasTodoComment(node, MESSAGE)) {
                    addTodoComment(node, MESSAGE, j)
                    hasTodos = true
                }
                return
            }
            current = current.parent
        }
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = migrationsGetAll
export default fn
