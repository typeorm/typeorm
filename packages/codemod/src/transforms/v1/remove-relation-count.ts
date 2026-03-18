import type { API, FileInfo } from "jscodeshift"
import { reportTodo } from "../todo"

export const description =
    "replace removed `@RelationCount` decorator with TODO"
export const manual = true

export const removeRelationCount = (file: FileInfo, api: API) => {
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
        const comment = j.commentLine(
            " TODO: `@RelationCount` was removed in TypeORM v1. Use `QueryBuilder` with `loadRelationCountAndMap()` instead. See migration guide: https://typeorm.io/docs/guides/migration-v1",
        )
        ;(path.node as any).comments = (path.node as any).comments || []
        ;(path.node as any).comments.push(comment)
        comment.leading = true
        hasChanges = true
        hasTodos = true
    })

    // Remove RelationCount import from typeorm
    root.find(j.ImportDeclaration, {
        source: { value: "typeorm" },
    }).forEach((importPath) => {
        const remaining = importPath.node.specifiers?.filter((spec) => {
            if (
                spec.type === "ImportSpecifier" &&
                spec.imported.type === "Identifier" &&
                spec.imported.name === "RelationCount"
            ) {
                hasChanges = true
                return false
            }
            return true
        })

        if (remaining && remaining.length === 0) {
            j(importPath).remove()
        } else if (remaining) {
            importPath.node.specifiers = remaining
        }
    })

    if (hasTodos) reportTodo("remove-relation-count", file, api)

    return hasChanges ? root.toSource() : undefined
}

export default removeRelationCount
