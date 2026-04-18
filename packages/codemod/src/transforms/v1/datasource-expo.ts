import path from "node:path"
import type { API, FileInfo, Node, ObjectExpression } from "jscodeshift"
import { fileImportsFrom, getStringValue } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    'add `driver: require("expo-sqlite")` to Expo data sources — legacy Expo driver was removed'
export const manual = true

const TODO_MESSAGE =
    'Expo legacy SQLite driver was removed — requires Expo SDK v52+ with the modern async API. `driver: require("expo-sqlite")` has been added automatically.'

// Returns the string key name for `Identifier` / `StringLiteral` /
// `Literal` keys, matching the behaviour established in `datasource-sqlite-type`.
const propertyKeyName = (
    prop: ObjectExpression["properties"][number],
): string | null => {
    if (prop.type !== "Property" && prop.type !== "ObjectProperty") return null
    return prop.key.type === "Identifier"
        ? prop.key.name
        : getStringValue(prop.key)
}

// Scope predicate: `{ type: "expo", database: "...", ... }` — we require the
// sibling `database` property to avoid mutating unrelated configs that merely
// reuse `type: "expo"` (e.g. commander/yargs option shapes).
const isExpoDataSource = (obj: ObjectExpression): boolean => {
    let hasExpoType = false
    let hasDatabase = false
    for (const prop of obj.properties) {
        const keyName = propertyKeyName(prop)
        if (!keyName) continue
        if (
            keyName === "type" &&
            (prop as { value: Node }).value !== undefined &&
            getStringValue(
                (prop as { value: Parameters<typeof getStringValue>[0] }).value,
            ) === "expo"
        ) {
            hasExpoType = true
        } else if (keyName === "database") {
            hasDatabase = true
        }
    }
    return hasExpoType && hasDatabase
}

const hasDriverProperty = (obj: ObjectExpression): boolean =>
    obj.properties.some((prop) => propertyKeyName(prop) === "driver")

// Statement-like ancestors that can host a TODO comment survivably through
// recast's printing. Walking to one of these lands the comment above the
// enclosing statement or declaration.
const isTodoHost = (type: string): boolean =>
    type.endsWith("Statement") ||
    type === "VariableDeclaration" ||
    type === "ExportDefaultDeclaration" ||
    type === "ExportNamedDeclaration" ||
    type === "ClassProperty" ||
    type === "PropertyDefinition"

export const datasourceExpo = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    // Scope guard: only operate on files that import from typeorm. Ormconfig-
    // style `.js` files with no typeorm import are deliberately skipped to
    // avoid mutating unrelated configs in apps that don't use typeorm.
    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    root.find(j.ObjectExpression).forEach((objPath) => {
        const obj = objPath.node
        if (!isExpoDataSource(obj)) return
        if (hasDriverProperty(obj)) return

        obj.properties.push(
            j.objectProperty(
                j.identifier("driver"),
                j.callExpression(j.identifier("require"), [
                    j.stringLiteral("expo-sqlite"),
                ]),
            ),
        )
        hasChanges = true

        // Walk up to the enclosing statement for the TODO comment, skipping
        // a host that already carries the same message (idempotent on
        // repeated runs).
        let current = objPath.parent
        while (current) {
            const node: Node = current.node
            if (isTodoHost(node.type)) {
                if (!hasTodoComment(node, TODO_MESSAGE)) {
                    addTodoComment(node, TODO_MESSAGE, j)
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

export const fn = datasourceExpo
export default fn
