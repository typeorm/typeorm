import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import {
    collectRepositoryBindings,
    fileImportsFrom,
    isRepositoryReceiver,
} from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "flag removed `stats()` for manual migration"
export const manual = true

export const mongodbStats = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    const bindings = collectRepositoryBindings(root, j)

    let hasChanges = false
    let hasTodos = false

    const message = "`stats()` was removed — use the MongoDB driver directly"

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "stats" },
        },
    }).forEach((callPath) => {
        const callee = callPath.node.callee
        if (callee.type !== "MemberExpression") return
        if (!isRepositoryReceiver(callee.object, bindings)) return

        // Prefer attaching the comment to the enclosing statement. Comments
        // on bare CallExpressions are often dropped by recast during printing.
        let host: Node = callPath.node
        const parentNode: Node = callPath.parent.node
        if (parentNode.type === "ExpressionStatement") {
            host = parentNode
        } else if (parentNode.type === "AwaitExpression") {
            const grandparentNode: Node = callPath.parent.parent.node
            if (grandparentNode.type === "ExpressionStatement") {
                host = grandparentNode
            }
        }
        if (hasTodoComment(host, message)) {
            hasChanges = true
            return
        }
        addTodoComment(host, message, j)
        hasChanges = true
        hasTodos = true
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = mongodbStats
export default fn
