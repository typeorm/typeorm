import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `replacePropertyNames` override for manual review"
export const manual = true

export const queryBuilderReplacePropertyNames = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    // Find method declarations named replacePropertyNames in classes
    const message =
        "`replacePropertyNames` was removed — property name replacement is now handled internally"

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

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = queryBuilderReplacePropertyNames
export default fn
