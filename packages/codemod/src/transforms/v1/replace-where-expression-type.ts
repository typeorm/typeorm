import type { API, FileInfo } from "jscodeshift"

/**
 * Renames WhereExpression → WhereExpressionBuilder in imports and type references.
 */
export const replaceWhereExpressionType = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // Rename in imports
    root.find(j.ImportSpecifier, {
        imported: { name: "WhereExpression" },
    }).forEach((path) => {
        path.node.imported.name = "WhereExpressionBuilder"
        if (
            path.node.local &&
            path.node.local.type === "Identifier" &&
            path.node.local.name === "WhereExpression"
        ) {
            path.node.local.name = "WhereExpressionBuilder"
        }
        hasChanges = true
    })

    // Rename in type references
    root.find(j.TSTypeReference, {
        typeName: { name: "WhereExpression" },
    }).forEach((path) => {
        if (path.node.typeName.type === "Identifier") {
            path.node.typeName.name = "WhereExpressionBuilder"
            hasChanges = true
        }
    })

    // Rename in identifiers (variable types, parameters, etc.)
    root.find(j.Identifier, { name: "WhereExpression" }).forEach((path) => {
        if (
            path.parent.node.type !== "ImportSpecifier" &&
            path.parent.node.type !== "TSTypeReference"
        ) {
            path.node.name = "WhereExpressionBuilder"
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default replaceWhereExpressionType
