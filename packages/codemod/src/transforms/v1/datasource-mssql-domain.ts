import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "replace removed `domain` option in MSSQL config with TODO"
export const manual = true

export const datasourceMssqlDomain = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    root.find(j.ObjectProperty, {
        key: { type: "Identifier", name: "domain" },
    }).forEach((path) => {
        addTodoComment(
            path.node,
            '`domain` was removed in TypeORM v1. Restructure to `authentication: { type: "ntlm", options: { domain: "..." } }`. See migration guide: https://typeorm.io/docs/guides/migration-v1',
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
