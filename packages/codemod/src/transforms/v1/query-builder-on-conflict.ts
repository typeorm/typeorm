import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { fileImportsFrom, getStringValue } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `onConflict()` for manual migration to `orIgnore()` / `orUpdate()`"
export const manual = true

// Walks up from `startPath` and returns the first statement-like ancestor
// a leading line-comment survives recast printing on. Returns null when no
// such ancestor is reachable (caller should skip the comment rather than
// attach it to a CallExpression, where it would be silently dropped).
const findTodoHost = (startPath: { parent: unknown }): Node | null => {
    let current = startPath.parent as { node: Node; parent: unknown } | null
    while (current) {
        const nodeType = current.node.type
        if (
            nodeType.endsWith("Statement") ||
            nodeType === "VariableDeclaration"
        ) {
            return current.node
        }
        current = current.parent as { node: Node; parent: unknown } | null
    }
    return null
}

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
    }).forEach((callPath) => {
        const arg = callPath.node.arguments[0]
        const argValue = arg ? getStringValue(arg) : null

        if (argValue && /DO\s+NOTHING/i.test(argValue)) {
            if (callPath.node.callee.type === "MemberExpression") {
                callPath.node.callee.property = j.identifier("orIgnore")
                callPath.node.arguments = []
                hasChanges = true
            }
            return
        }

        const message =
            "`onConflict()` was removed — use `orIgnore()` or `orUpdate()` instead"
        const host = findTodoHost(callPath)
        if (!host) return
        if (!hasTodoComment(host, message)) {
            addTodoComment(host, message, j)
        }
        hasChanges = true
        hasTodos = true
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = queryBuilderOnConflict
export default fn
