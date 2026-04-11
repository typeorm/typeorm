import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { setStringValue } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "replace `sqlite` driver with `better-sqlite3`"

export const datasourceSqliteType = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // TSX parser uses ObjectProperty (not Property) and StringLiteral
    root.find(j.ObjectProperty, {
        key: { type: "Identifier", name: "type" },
        value: { type: "StringLiteral", value: "sqlite" },
    }).forEach((path) => {
        setStringValue(path.node.value, "better-sqlite3")
        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceSqliteType
export default fn
