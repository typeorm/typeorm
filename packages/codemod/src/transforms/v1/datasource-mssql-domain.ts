import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `domain` MSSQL option for manual migration"
export const manual = true

export const datasourceMssqlDomain = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    root.find(j.ObjectProperty, {
        key: { type: "Identifier", name: "domain" },
    }).forEach((path) => {
        addTodoComment(
            path.node,
            '`domain` was removed — restructure to `authentication: { type: "ntlm", options: { domain: "..." } }`',
            j,
        )
        hasChanges = true
        hasTodos = true
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceMssqlDomain
export default fn
