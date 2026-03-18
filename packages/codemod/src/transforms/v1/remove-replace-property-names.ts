import type { API, FileInfo } from "jscodeshift"
import { reportTodo } from "../todo"

export const description =
    "flag removed `replacePropertyNames` override with TODO"
export const manual = true

export const removeReplacePropertyNames = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    // Find method declarations named replacePropertyNames in classes
    root.find(j.ClassMethod, {
        key: { type: "Identifier", name: "replacePropertyNames" },
    }).forEach((path) => {
        const comment = j.commentLine(
            " TODO: `replacePropertyNames` was removed in TypeORM v1. This method override is no longer called. See migration guide: https://typeorm.io/docs/guides/migration-v1",
        )
        ;(path.node as any).comments = (path.node as any).comments || []
        ;(path.node as any).comments.push(comment)
        comment.leading = true
        hasChanges = true
        hasTodos = true
    })

    // Also check for MethodDefinition (alternative AST representation)
    root.find(j.MethodDefinition, {
        key: { type: "Identifier", name: "replacePropertyNames" },
    }).forEach((path) => {
        const comment = j.commentLine(
            " TODO: `replacePropertyNames` was removed in TypeORM v1. This method override is no longer called. See migration guide: https://typeorm.io/docs/guides/migration-v1",
        )
        ;(path.node as any).comments = (path.node as any).comments || []
        ;(path.node as any).comments.push(comment)
        comment.leading = true
        hasChanges = true
        hasTodos = true
    })

    if (hasTodos) reportTodo("remove-replace-property-names", file, api)

    return hasChanges ? root.toSource() : undefined
}

export default removeReplacePropertyNames
