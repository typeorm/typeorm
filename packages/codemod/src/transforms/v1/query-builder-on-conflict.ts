import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { fileImportsFrom, getStringValue } from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `onConflict()` for manual migration to `orIgnore()` / `orUpdate()`"
export const manual = true

export const queryBuilderOnConflict = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

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
                "`onConflict()` was removed — use `orIgnore()` or `orUpdate()` instead"
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

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = queryBuilderOnConflict
export default fn
