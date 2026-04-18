import path from "node:path"
import type {
    API,
    CallExpression,
    FileInfo,
    Node,
    ObjectExpression,
} from "jscodeshift"
import { fileImportsFrom, getStringValue } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    'flag redundant `driver: require("expo-sqlite")` on Expo data sources — v1 auto-loads it'
export const manual = true

const TODO_MESSAGE =
    '`driver: require("expo-sqlite")` is no longer needed — TypeORM v1 auto-loads `expo-sqlite`. You can remove this line. Keep it only if you are intentionally overriding (e.g. patch-package, custom wrapper).'

// Returns the string key name for `Identifier` / `StringLiteral` /
// `Literal` keys, matching the pattern used elsewhere in the codemod.
const propertyKeyName = (
    prop: ObjectExpression["properties"][number],
): string | null => {
    if (prop.type !== "Property" && prop.type !== "ObjectProperty") return null
    return prop.key.type === "Identifier"
        ? prop.key.name
        : getStringValue(prop.key)
}

// Scope predicate: `{ type: "expo", database: "...", ... }`. The sibling
// `database` requirement avoids flagging unrelated configs that merely reuse
// `type: "expo"` (e.g. commander/yargs option shapes).
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

// Matches the exact default shape `require("expo-sqlite")`. Member accesses
// (`.default`), different packages, identifiers, and custom wrappers are left
// alone — users passing those want the override.
const isDefaultExpoSqliteRequire = (value: Node): boolean => {
    if (value.type !== "CallExpression") return false
    const call = value as CallExpression
    if (call.callee.type !== "Identifier" || call.callee.name !== "require") {
        return false
    }
    const [arg] = call.arguments
    if (!arg) return false
    return getStringValue(arg) === "expo-sqlite"
}

// Statement-like ancestors that can host a TODO comment survivably through
// recast's printing.
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

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasTodos = false

    root.find(j.ObjectExpression).forEach((objPath) => {
        const obj = objPath.node
        if (!isExpoDataSource(obj)) return

        const driverProp = obj.properties.find(
            (prop) => propertyKeyName(prop) === "driver",
        )
        if (!driverProp) return
        if (
            driverProp.type !== "Property" &&
            driverProp.type !== "ObjectProperty"
        ) {
            return
        }
        if (!isDefaultExpoSqliteRequire(driverProp.value as Node)) return

        // Walk up to the enclosing statement for the TODO. Idempotent: skip if
        // the same message is already attached.
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
