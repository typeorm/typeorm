import type { API, FileInfo } from "jscodeshift"
import { reportTodo } from "../todo"

export const description =
    "replace removed `onConflict()` with `orIgnore()` or TODO"
export const manual = true

export const replaceOnConflict = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "onConflict" },
        },
    }).forEach((path) => {
        const arg = path.node.arguments[0]
        const argValue =
            arg?.type === "StringLiteral"
                ? arg.value
                : arg?.type === "Literal" && typeof arg.value === "string"
                  ? arg.value
                  : null

        if (argValue && /DO\s+NOTHING/i.test(argValue)) {
            // Replace .onConflict("DO NOTHING") with .orIgnore()
            if (path.node.callee.type === "MemberExpression") {
                path.node.callee.property = j.identifier("orIgnore")
                path.node.arguments = []
                hasChanges = true
            }
        } else {
            // Add a TODO comment
            const parent = path.parent
            if (parent.node.type === "ExpressionStatement") {
                const comment = j.commentLine(
                    " TODO: `onConflict()` was removed in TypeORM v1. Use `orIgnore()` or `orUpdate()` instead. See migration guide: https://typeorm.io/docs/guides/migration-v1",
                )
                parent.node.comments = parent.node.comments || []
                parent.node.comments.push(comment)
                comment.leading = true
            } else {
                const comment = j.commentLine(
                    " TODO: `onConflict()` was removed in TypeORM v1. Use `orIgnore()` or `orUpdate()` instead. See migration guide: https://typeorm.io/docs/guides/migration-v1",
                )
                ;(path.node as any).comments = (path.node as any).comments || []
                ;(path.node as any).comments.push(comment)
                comment.leading = true
            }
            hasChanges = true
            hasTodos = true
        }
    })

    if (hasTodos) reportTodo("replace-on-conflict", file, api)

    return hasChanges ? root.toSource() : undefined
}

export default replaceOnConflict
