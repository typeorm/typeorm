import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { removeImportSpecifiers } from "../ast-helpers"
import { addTodoComment, reportTodo } from "../todo"

export const name = path.basename(__filename, path.extname(__filename))
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
            const replacement = j.emptyStatement()
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

    if (removeImportSpecifiers(root, j, "typeorm", removedImports)) {
        hasChanges = true
    }

    if (hasTodos) reportTodo(name, file, api)

    return hasChanges ? root.toSource() : undefined
}

export const fn = useContainer
export default fn
