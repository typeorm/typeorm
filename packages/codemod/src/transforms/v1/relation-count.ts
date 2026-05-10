import path from "node:path"
import type { API, ClassProperty, Decorator, FileInfo, Node } from "jscodeshift"
import {
    getLocalNamesForImport,
    getStringValue,
    removeImportSpecifiers,
    removeReExportSpecifiers,
} from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `@RelationCount` decorator and `loadRelationCountAndMap()` for manual migration"
export const manual = true

const MIGRATION_HINT = "use `@VirtualColumn` with a sub-query instead"

// Node types on which a leading line-comment survives jscodeshift/recast
// printing — walking up to one of these keeps the comment visible above
// the enclosing statement or declaration.
const isTodoHost = (type: string): boolean =>
    type.endsWith("Statement") ||
    type === "VariableDeclaration" ||
    type === "ExportDefaultDeclaration" ||
    type === "ExportNamedDeclaration" ||
    type === "ClassProperty" ||
    type === "PropertyDefinition"

export const relationCount = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    // No `fileImportsFrom` guard at the top: `.loadRelationCountAndMap()` call
    // sites can appear in files that only receive a `QueryBuilder` via a helper
    // and never import from "typeorm" directly. The decorator and import-
    // removal blocks below self-gate via `getLocalNamesForImport` /
    // `removeImportSpecifiers`, which are no-ops when typeorm is absent.

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
        // class properties explicitly instead and attach the comment to the
        // property itself (decorator-attached comments are dropped by recast).
        const message = `\`@RelationCount\` was removed — ${MIGRATION_HINT}`
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
            if (hasTodoComment(node, message)) return
            addTodoComment(node, message, j)
            hasChanges = true
            hasTodos = true
        })
    }

    // Find .loadRelationCountAndMap() call sites — attach the comment above the enclosing statement.
    // Multiple chained calls on one statement resolve to the same host, so the
    // `hasTodoComment` guard keeps the transform idempotent.
    const callMessage = `\`loadRelationCountAndMap()\` was removed — ${MIGRATION_HINT}`
    // Match both dot access (`qb.loadRelationCountAndMap()`) and computed
    // access (`qb["loadRelationCountAndMap"]()`). Use a post-filter rather
    // than a find-pattern so the computed-key branch is visited too.
    root.find(j.CallExpression).forEach((callPath) => {
        const callee = callPath.node.callee
        if (callee.type !== "MemberExpression") return
        const prop = callee.property
        const matches =
            (prop.type === "Identifier" &&
                prop.name === "loadRelationCountAndMap") ||
            (callee.computed &&
                getStringValue(prop) === "loadRelationCountAndMap")
        if (!matches) return

        let current = callPath.parent
        while (current) {
            const node: Node = current.node
            if (isTodoHost(node.type)) {
                if (!hasTodoComment(node, callMessage)) {
                    addTodoComment(node, callMessage, j)
                    hasChanges = true
                    hasTodos = true
                }
                break
            }
            current = current.parent
        }
    })

    if (
        removeImportSpecifiers(root, j, "typeorm", new Set(["RelationCount"]))
    ) {
        hasChanges = true
    }
    if (
        removeReExportSpecifiers(root, j, "typeorm", new Set(["RelationCount"]))
    ) {
        hasChanges = true
    }

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = relationCount
export default fn
