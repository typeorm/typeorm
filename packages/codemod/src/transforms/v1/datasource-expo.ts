import path from "node:path"
import type { API, FileInfo, Node, ObjectExpression } from "jscodeshift"
import { fileImportsFrom, getStringValue } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag Expo data sources that require a v52+ SDK bump after the legacy driver removal"
export const manual = true

const TODO_MESSAGE =
    "Expo legacy SQLite driver was removed — requires Expo SDK v52+ with the modern async API. TypeORM auto-loads `expo-sqlite` now; no `driver:` option is needed unless you want to override it."

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
// sibling `database` property to avoid flagging unrelated configs that merely
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
    // avoid flagging unrelated configs in apps that don't use typeorm.
    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasTodos = false

    root.find(j.ObjectExpression).forEach((objPath) => {
        if (!isExpoDataSource(objPath.node)) return

        // Walk up to the enclosing statement for the TODO comment, skipping a
        // host that already carries the same message (idempotent on repeated
        // runs).
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

    return hasTodos ? root.toSource() : undefined
}

export const fn = datasourceExpo
export default fn
