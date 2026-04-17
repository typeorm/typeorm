import path from "node:path"
import type { API, ASTNode, FileInfo } from "jscodeshift"
import { getStringValue, setStringValue } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "replace `sqlite` driver with `better-sqlite3`"

export const datasourceSqliteType = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // Match both Property (Esprima) and ObjectProperty (Babel) node shapes
    // and both Identifier (`type:`) and string-literal (`"type":`) keys.
    // Use `getStringValue` rather than filtering on `StringLiteral` directly
    // so behaviour stays consistent with the rest of the transforms.
    const visit = (node: { key: ASTNode; value: ASTNode }) => {
        const keyName =
            node.key.type === "Identifier"
                ? node.key.name
                : getStringValue(node.key)
        if (keyName !== "type") return
        if (getStringValue(node.value) !== "sqlite") return
        setStringValue(node.value, "better-sqlite3")
        hasChanges = true
    }

    root.find(j.Property).forEach((p) => visit(p.node))
    root.find(j.ObjectProperty).forEach((p) => visit(p.node))

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceSqliteType
export default fn
