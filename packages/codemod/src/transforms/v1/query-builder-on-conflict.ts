import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { getStringValue } from "../ast-helpers"
import { addTodoComment, reportTodo } from "../todo"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "replace removed `onConflict()` with `orIgnore()` or TODO"
export const manual = true

export const queryBuilderOnConflict = (file: FileInfo, api: API) => {
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
        const argValue = arg ? getStringValue(arg) : null

        if (argValue && /DO\s+NOTHING/i.test(argValue)) {
            // Replace .onConflict("DO NOTHING") with .orIgnore()
            if (path.node.callee.type === "MemberExpression") {
                path.node.callee.property = j.identifier("orIgnore")
                path.node.arguments = []
                hasChanges = true
            }
        } else {
            // Add a TODO comment
            const message =
                "`onConflict()` was removed in TypeORM v1. Use `orIgnore()` or `orUpdate()` instead. See migration guide: https://typeorm.io/docs/guides/migration-v1"
            const parentNode: Node = path.parent.node
            if (parentNode.type === "ExpressionStatement") {
                addTodoComment(parentNode, message, j)
            } else {
                addTodoComment(path.node, message, j)
            }
            hasChanges = true
            hasTodos = true
        }
    })

    if (hasTodos) reportTodo(name, file, api)

    return hasChanges ? root.toSource() : undefined
}

export const fn = queryBuilderOnConflict
export default fn
