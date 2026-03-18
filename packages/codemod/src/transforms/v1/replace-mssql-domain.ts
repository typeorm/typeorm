import type { API, FileInfo } from "jscodeshift"
import { reportTodo } from "../todo"

export const description =
    "replace removed `domain` option in MSSQL config with TODO"
export const manual = true

export const replaceMssqlDomain = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    root.find(j.ObjectProperty, {
        key: { type: "Identifier", name: "domain" },
    }).forEach((path) => {
        const comment = j.commentLine(
            ' TODO: `domain` was removed in TypeORM v1. Restructure to `authentication: { type: "ntlm", options: { domain: "..." } }`. See migration guide: https://typeorm.io/docs/guides/migration-v1',
        )
        ;(path.node as any).comments = (path.node as any).comments || []
        ;(path.node as any).comments.push(comment)
        comment.leading = true
        hasChanges = true
        hasTodos = true
    })

    if (hasTodos) reportTodo("replace-mssql-domain", file, api)

    return hasChanges ? root.toSource() : undefined
}

export default replaceMssqlDomain
