import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { removeImportSpecifiers } from "../ast-helpers"
import { addTodoComment, reportTodo } from "../todo"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "replace removed `@RelationCount` decorator with TODO"
export const manual = true

export const relationCount = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    // Find @RelationCount decorators and add TODO
    root.find(j.Decorator, {
        expression: {
            type: "CallExpression",
            callee: { type: "Identifier", name: "RelationCount" },
        },
    }).forEach((path) => {
        addTodoComment(
            path.node,
            "`@RelationCount` was removed in TypeORM v1. Use `QueryBuilder` with `loadRelationCountAndMap()` instead. See migration guide: https://typeorm.io/docs/guides/migration-v1",
            j,
        )
        hasChanges = true
        hasTodos = true
    })

    // Remove RelationCount import from typeorm
    if (
        removeImportSpecifiers(root, j, "typeorm", new Set(["RelationCount"]))
    ) {
        hasChanges = true
    }

    if (hasTodos) reportTodo(name, file, api)

    return hasChanges ? root.toSource() : undefined
}

export const fn = relationCount
export default fn
