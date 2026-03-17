import type { API, FileInfo } from "jscodeshift"

/**
 * Removes useContainer() and getFromContainer() calls and their imports.
 * Adds a TODO comment at each removal site.
 */
export const removeUseContainer = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const removedFunctions = new Set(["useContainer", "getFromContainer"])

    // Replace calls with a TODO comment
    for (const funcName of removedFunctions) {
        root.find(j.ExpressionStatement, {
            expression: {
                type: "CallExpression",
                callee: { type: "Identifier", name: funcName },
            },
        }).forEach((path) => {
            // Replace with a comment
            const comment = j.expressionStatement(j.identifier("undefined"))
            comment.comments = [
                j.commentLine(
                    ` TODO: ${funcName}() was removed in TypeORM v1. See migration guide: https://typeorm.io/docs/guides/migration-v1#container-system`,
                ),
            ]
            j(path).replaceWith(comment)
            hasChanges = true
        })
    }

    // Remove imports
    const removedImports = new Set([
        "useContainer",
        "getFromContainer",
        "ContainerInterface",
        "ContainedType",
        "UseContainerOptions",
    ])

    root.find(j.ImportDeclaration, {
        source: { value: "typeorm" },
    }).forEach((importPath) => {
        const remaining = importPath.node.specifiers?.filter((spec) => {
            if (
                spec.type === "ImportSpecifier" &&
                spec.imported.type === "Identifier"
            ) {
                if (removedImports.has(spec.imported.name)) {
                    hasChanges = true
                    return false
                }
            }
            return true
        })

        if (remaining && remaining.length === 0) {
            j(importPath).remove()
        } else if (remaining) {
            importPath.node.specifiers = remaining
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default removeUseContainer
