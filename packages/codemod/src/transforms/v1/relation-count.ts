import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { removeImportSpecifiers } from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `@RelationCount` decorator and `loadRelationCountAndMap()` for manual migration"
export const manual = true

const MIGRATION_HINT =
    "use `@VirtualColumn` with a sub-query instead — see the v1 upgrading guide"

export const relationCount = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    // Find @RelationCount decorators and add TODO. Note: jscodeshift
    // currently loses leading comments attached to decorators or their
    // enclosing class members in the printed output, so this TODO is
    // largely a signal for future runs when the printer improves.
    // The removed `RelationCount` import below will surface the break
    // immediately as a TypeScript error.
    root.find(j.Decorator, {
        expression: {
            type: "CallExpression",
            callee: { type: "Identifier", name: "RelationCount" },
        },
    }).forEach((decoratorPath) => {
        addTodoComment(
            decoratorPath.node,
            `\`@RelationCount\` was removed — ${MIGRATION_HINT}`,
            j,
        )
        hasChanges = true
        hasTodos = true
    })

    // Find .loadRelationCountAndMap() calls and add TODO above the enclosing statement
    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "loadRelationCountAndMap" },
        },
    }).forEach((callPath) => {
        let current = callPath.parent
        while (current) {
            const node: Node = current.node
            if (
                node.type === "ExpressionStatement" ||
                node.type === "VariableDeclaration" ||
                node.type === "ReturnStatement"
            ) {
                addTodoComment(
                    node,
                    `\`loadRelationCountAndMap()\` was removed — ${MIGRATION_HINT}`,
                    j,
                )
                hasChanges = true
                hasTodos = true
                break
            }
            current = current.parent
        }
    })

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
