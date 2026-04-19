import path from "node:path"
import type { API, FileInfo, Node, ObjectExpression } from "jscodeshift"
import { fileImportsFrom, getStringValue } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `join` find option for manual migration to `relations` or QueryBuilder"
export const manual = true

const MIGRATION_HINT =
    "migrate `leftJoinAndSelect` to the `relations` option, or switch to QueryBuilder for `innerJoin`/`innerJoinAndSelect`/`leftJoin`"

const MESSAGE = `\`join\` find option was removed — ${MIGRATION_HINT}`

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

// A find-options `join` property has a value like
// `{ alias: "...", leftJoinAndSelect: { ... }, ... }`. We look for the
// `alias` sub-property to distinguish it from unrelated `join` keys.
// Accept both `ObjectProperty` (Babel) and `Property` (Esprima) node shapes
// and both identifier (`join:`) and string-literal (`"join":`) keys.
const isFindOptionsJoinProperty = (
    prop: ObjectExpression["properties"][number],
): boolean => {
    if (prop.type !== "Property" && prop.type !== "ObjectProperty") {
        return false
    }
    const keyName =
        prop.key.type === "Identifier"
            ? prop.key.name
            : getStringValue(prop.key)
    if (keyName !== "join") return false
    if (prop.value.type !== "ObjectExpression") return false

    return prop.value.properties.some((inner) => {
        if (inner.type !== "Property" && inner.type !== "ObjectProperty") {
            return false
        }
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

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    root.find(j.ObjectExpression).forEach((objPath) => {
        const obj = objPath.node
        const hasJoin = obj.properties.some(isFindOptionsJoinProperty)
        if (!hasJoin) return

        let current = objPath.parent
        while (current) {
            const node: Node = current.node
            if (isTodoHost(node.type)) {
                if (!hasTodoComment(node, MESSAGE)) {
                    addTodoComment(node, MESSAGE, j)
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
