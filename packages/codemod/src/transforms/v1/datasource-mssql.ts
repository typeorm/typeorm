import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "migrate removed MSSQL `domain` option and fix isolation level format"
export const manual = true

const isolationValueRenames: Record<string, string> = {
    READ_UNCOMMITTED: "READ UNCOMMITTED",
    READ_COMMITTED: "READ COMMITTED",
    REPEATABLE_READ: "REPEATABLE READ",
}

export const datasourceMssql = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    // Flag removed `domain` option with TODO
    root.find(j.ObjectProperty, {
        key: { type: "Identifier", name: "domain" },
    }).forEach((propPath) => {
        addTodoComment(
            propPath.node,
            '`domain` was removed — restructure to `authentication: { type: "ntlm", options: { domain: "..." } }`',
            j,
        )
        hasChanges = true
        hasTodos = true
    })

    // Rename `isolation` → `isolationLevel`
    root.find(j.ObjectProperty, {
        key: { type: "Identifier", name: "isolation" },
    }).forEach((propPath) => {
        if (propPath.node.key.type === "Identifier") {
            propPath.node.key.name = "isolationLevel"
            hasChanges = true
        }
    })

    // Fix isolation value format: "READ_COMMITTED" → "READ COMMITTED" etc.
    for (const [oldValue, newValue] of Object.entries(isolationValueRenames)) {
        root.find(j.StringLiteral, { value: oldValue }).forEach((strPath) => {
            strPath.node.value = newValue
            hasChanges = true
        })
    }

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceMssql
export default fn
