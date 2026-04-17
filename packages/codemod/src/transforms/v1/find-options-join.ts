import path from "node:path"
import type { API, FileInfo, Node, ObjectProperty } from "jscodeshift"
import { fileImportsFrom, getStringValue } from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `join` find option for manual migration to `relations` or QueryBuilder"
export const manual = true

const MIGRATION_HINT =
    "migrate `leftJoinAndSelect` to the `relations` option, or switch to QueryBuilder for `innerJoin`/`innerJoinAndSelect`/`leftJoin` — see the v1 upgrading guide"

// A find-options `join` property has a value like
// `{ alias: "...", leftJoinAndSelect: { ... }, ... }`. We look for the
// `alias` sub-property to distinguish it from unrelated `join` keys.
const isFindOptionsJoinProperty = (prop: ObjectProperty): boolean => {
    const keyName =
        prop.key.type === "Identifier"
            ? prop.key.name
            : getStringValue(prop.key)
    if (keyName !== "join") return false
    if (prop.value.type !== "ObjectExpression") return false

    return prop.value.properties.some((inner) => {
        if (inner.type !== "ObjectProperty") return false
        const innerKey =
            inner.key.type === "Identifier"
                ? inner.key.name
                : getStringValue(inner.key)
        return innerKey === "alias"
    })
}

export const findOptionsJoin = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    // Only operate on files that import from typeorm
    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    root.find(j.ObjectExpression).forEach((objPath) => {
        const obj = objPath.node
        const hasJoin = obj.properties.some(
            (prop) =>
                prop.type === "ObjectProperty" &&
                isFindOptionsJoinProperty(prop),
        )
        if (!hasJoin) return

        // Walk up to the enclosing statement for the TODO
        let current = objPath.parent
        while (current) {
            const node: Node = current.node
            if (
                node.type === "ExpressionStatement" ||
                node.type === "VariableDeclaration" ||
                node.type === "ReturnStatement" ||
                node.type === "ExportDefaultDeclaration" ||
                node.type === "ExportNamedDeclaration"
            ) {
                const todoLine = ` TODO(typeorm-v1): \`join\` find option was removed — ${MIGRATION_HINT}`
                const nodeWithComments = node as Node & {
                    comments?: { value: string }[]
                }
                const alreadyFlagged = nodeWithComments.comments?.some(
                    (c) => c.value === todoLine,
                )
                if (!alreadyFlagged) {
                    addTodoComment(
                        node,
                        `\`join\` find option was removed — ${MIGRATION_HINT}`,
                        j,
                    )
                    hasChanges = true
                    hasTodos = true
                }
                break
            }
            current = current.parent
        }
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = findOptionsJoin
export default fn
