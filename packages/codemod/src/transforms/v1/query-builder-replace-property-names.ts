import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { addTodoComment, reportTodo } from "../todo"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `replacePropertyNames` override with TODO"
export const manual = true

export const queryBuilderReplacePropertyNames = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    // Find method declarations named replacePropertyNames in classes
    const message =
        "`replacePropertyNames` was removed in TypeORM v1. This method override is no longer called. See migration guide: https://typeorm.io/docs/guides/migration-v1"

    root.find(j.ClassMethod, {
        key: { type: "Identifier", name: "replacePropertyNames" },
    }).forEach((path) => {
        addTodoComment(path.node, message, j)
        hasChanges = true
        hasTodos = true
    })

    // Also check for MethodDefinition (alternative AST representation)
    root.find(j.MethodDefinition, {
        key: { type: "Identifier", name: "replacePropertyNames" },
    }).forEach((path) => {
        addTodoComment(path.node, message, j)
        hasChanges = true
        hasTodos = true
    })

    if (hasTodos) reportTodo(name, file, api)

    return hasChanges ? root.toSource() : undefined
}

export const fn = queryBuilderReplacePropertyNames
export default fn
