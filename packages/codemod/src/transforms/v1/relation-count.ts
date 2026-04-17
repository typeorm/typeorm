import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { removeImportSpecifiers } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `@RelationCount` decorator for manual migration"
export const manual = true

export const relationCount = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    const message =
        "`@RelationCount` was removed — use `QueryBuilder` with `loadRelationCountAndMap()` instead"

    // Find @RelationCount decorators and add TODO
    root.find(j.Decorator, {
        expression: {
            type: "CallExpression",
            callee: { type: "Identifier", name: "RelationCount" },
        },
    }).forEach((path) => {
        if (!hasTodoComment(path.node, message)) {
            addTodoComment(path.node, message, j)
            hasTodos = true
        }
        hasChanges = true
    })

    // Remove RelationCount import from typeorm
    if (
        removeImportSpecifiers(root, j, "typeorm", new Set(["RelationCount"]))
    ) {
        hasChanges = true
    }

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = relationCount
export default fn
