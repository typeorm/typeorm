import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import {
    expandLocalNamesForImports,
    fileImportsFrom,
    renameReExportSpecifiers,
} from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "rename `WhereExpression` to `WhereExpressionBuilder`"

export const queryBuilderWhereExpression = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    // Only rename TS type references that resolve to a TypeORM import —
    // a local `interface WhereExpression {}` or an import from another
    // package must not be rewritten.
    const whereExpressionLocalNames = expandLocalNamesForImports(
        root,
        j,
        "typeorm",
        new Set(["WhereExpression"]),
    )

    root.find(j.ImportSpecifier, {
        imported: { name: "WhereExpression" },
    }).forEach((importPath) => {
        const parent = importPath.parent.node
        if (
            parent.type !== "ImportDeclaration" ||
            parent.source.value !== "typeorm"
        ) {
            return
        }
        importPath.node.imported.name = "WhereExpressionBuilder"
        if (
            importPath.node.local?.type === "Identifier" &&
            importPath.node.local?.name === "WhereExpression"
        ) {
            importPath.node.local.name = "WhereExpressionBuilder"
        }
        hasChanges = true
    })

    if (
        renameReExportSpecifiers(root, j, "typeorm", {
            WhereExpression: "WhereExpressionBuilder",
        })
    ) {
        hasChanges = true
    }

    root.find(j.TSTypeReference, {
        typeName: { name: "WhereExpression" },
    }).forEach((refPath) => {
        if (refPath.node.typeName.type !== "Identifier") return
        if (!whereExpressionLocalNames.has(refPath.node.typeName.name)) return
        refPath.node.typeName.name = "WhereExpressionBuilder"
        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = queryBuilderWhereExpression
export default fn
