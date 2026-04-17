import path from "node:path"
import type { API, ClassProperty, Decorator, FileInfo } from "jscodeshift"
import {
    fileImportsFrom,
    getLocalNamesForImport,
    removeImportSpecifiers,
} from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `@RelationCount` decorator for manual migration"
export const manual = true

export const relationCount = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    // Collect local names bound to `RelationCount` from typeorm — including aliases:
    //   import { RelationCount } from "typeorm"          → "RelationCount"
    //   import { RelationCount as RC } from "typeorm"    → "RC"
    const localNames = getLocalNamesForImport(
        root,
        j,
        "typeorm",
        "RelationCount",
    )

    if (localNames.size > 0) {
        // Decorators live on `ClassProperty.decorators` but jscodeshift's
        // default visitor does not descend into that array, so
        // `root.find(j.Decorator)` is a no-op with the `tsx` parser. Walk the
        // class properties explicitly instead and attach the TODO to the
        // property itself (decorator-attached comments are dropped by recast).
        const message =
            "`@RelationCount` was removed — use `QueryBuilder` with `loadRelationCountAndMap()` instead"
        root.find(j.ClassProperty).forEach((propertyPath) => {
            const node = propertyPath.node as ClassProperty & {
                decorators?: Decorator[]
            }
            const matches = node.decorators?.some((decorator) => {
                const expr = decorator.expression
                return (
                    expr.type === "CallExpression" &&
                    expr.callee.type === "Identifier" &&
                    localNames.has(expr.callee.name)
                )
            })
            if (!matches) return
            addTodoComment(node, message, j)
            hasChanges = true
            hasTodos = true
        })
    }

    // Remove RelationCount import from typeorm
    if (
        removeImportSpecifiers(root, j, "typeorm", new Set(["RelationCount"]))
    ) {
        hasChanges = true
    }

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = relationCount
export default fn
