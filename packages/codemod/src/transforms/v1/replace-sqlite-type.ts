import type { API, FileInfo } from "jscodeshift"

export const description = "replace `sqlite` driver with `better-sqlite3`"

export const replaceSqliteType = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // TSX parser uses ObjectProperty (not Property) and StringLiteral
    root.find(j.ObjectProperty, {
        key: { type: "Identifier", name: "type" },
        value: { type: "StringLiteral", value: "sqlite" },
    }).forEach((path) => {
        if (path.node.value.type === "StringLiteral") {
            path.node.value.value = "better-sqlite3"
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default replaceSqliteType
