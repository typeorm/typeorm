import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { renameReExportSpecifiers } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "rename `WhereExpression` to `WhereExpressionBuilder`"

export const queryBuilderWhereExpression = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // Rename in imports
    root.find(j.ImportSpecifier, {
        imported: { name: "WhereExpression" },
    }).forEach((path) => {
        path.node.imported.name = "WhereExpressionBuilder"
        if (
            path.node.local?.type === "Identifier" &&
            path.node.local?.name === "WhereExpression"
        ) {
            path.node.local.name = "WhereExpressionBuilder"
        }
        hasChanges = true
    })

    // Rename in re-exports (barrel-file pattern)
    if (
        renameReExportSpecifiers(root, j, "typeorm", {
            WhereExpression: "WhereExpressionBuilder",
        })
    ) {
        hasChanges = true
    }

    // Rename in type references
    root.find(j.TSTypeReference, {
        typeName: { name: "WhereExpression" },
    }).forEach((path) => {
        if (path.node.typeName.type === "Identifier") {
            path.node.typeName.name = "WhereExpressionBuilder"
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = queryBuilderWhereExpression
export default fn
