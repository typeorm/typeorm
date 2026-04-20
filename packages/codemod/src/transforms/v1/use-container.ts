import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import {
    fileImportsFrom,
    removeImportSpecifiers,
    removeReExportSpecifiers,
} from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "remove `useContainer()` and `getFromContainer()` calls"
export const manual = true

export const useContainer = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    // `useContainer` is also exported by typedi/tsyringe, so gate the
    // transform to files that actually import from typeorm and avoid
    // rewriting unrelated DI container calls.
    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    const removedFunctions = new Set(["useContainer", "getFromContainer"])

    for (const funcName of removedFunctions) {
        root.find(j.ExpressionStatement, {
            expression: {
                type: "CallExpression",
                callee: { type: "Identifier", name: funcName },
            },
        }).forEach((path) => {
            const replacement = j.emptyStatement()
            addTodoComment(
                replacement,
                `${funcName}() was removed — the container system is no longer supported`,
                j,
            )
            j(path).replaceWith(replacement)
            hasChanges = true
            hasTodos = true
        })
    }

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

    // Remove re-exports of the same symbols (barrel-file pattern)
    if (removeReExportSpecifiers(root, j, "typeorm", removedImports)) {
        hasChanges = true
    }

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = useContainer
export default fn
