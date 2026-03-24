import type { API, FileInfo } from "jscodeshift"
import { addTodoComment, reportTodo } from "../todo"

export const description =
    "remove `useContainer()` and `getFromContainer()` calls"
export const manual = true

export const useContainer = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

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
            const replacement = j.expressionStatement(j.identifier("undefined"))
            addTodoComment(
                replacement,
                `${funcName}() was removed in TypeORM v1. See migration guide: https://typeorm.io/docs/guides/migration-v1#container-system`,
                j,
            )
            j(path).replaceWith(replacement)
            hasChanges = true
            hasTodos = true
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

        if (remaining?.length === 0) {
            j(importPath).remove()
        } else if (remaining) {
            importPath.node.specifiers = remaining
        }
    })

    if (hasTodos) reportTodo("remove-use-container", file, api)

    return hasChanges ? root.toSource() : undefined
}

export default useContainer
