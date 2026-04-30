import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
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

    const message =
        "`replacePropertyNames` was removed — property name replacement is now handled internally"

    const flag = (node: Node): void => {
        if (hasTodoComment(node, message)) {
            hasChanges = true
            return
        }
        addTodoComment(node, message, j)
        hasChanges = true
        hasTodos = true
    }

    root.find(j.ClassMethod, {
        key: { type: "Identifier", name: "replacePropertyNames" },
    }).forEach((p) => flag(p.node))

    // MethodDefinition is an alternative AST shape some parsers emit for the
    // same construct; cover both so the transform is parser-agnostic.
    root.find(j.MethodDefinition, {
        key: { type: "Identifier", name: "replacePropertyNames" },
    }).forEach((p) => flag(p.node))

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = queryBuilderReplacePropertyNames
export default fn
