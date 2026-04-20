import path from "node:path"
import type {
    API,
    CallExpression,
    FileInfo,
    Node,
    ObjectExpression,
} from "jscodeshift"
import { fileImportsFrom, getStringValue } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "remove redundant `expo-sqlite` driver injection on Expo data sources — v1 auto-loads it"

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
// `database` requirement avoids mutating unrelated configs that merely reuse
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

export const datasourceExpo = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false

    root.find(j.ObjectExpression).forEach((objPath) => {
        const obj = objPath.node
        if (!isExpoDataSource(obj)) return

        const driverIdx = obj.properties.findIndex(
            (prop) => propertyKeyName(prop) === "driver",
        )
        if (driverIdx === -1) return
        const driverProp = obj.properties[driverIdx]
        if (
            driverProp.type !== "Property" &&
            driverProp.type !== "ObjectProperty"
        ) {
            return
        }
        if (!isDefaultExpoSqliteRequire(driverProp.value as Node)) return

        // Delete the redundant `driver: require("expo-sqlite")` — v1 auto-loads
        // it. Users with custom wrappers / patch-package overrides fall through
        // `isDefaultExpoSqliteRequire` above and keep their explicit line.
        obj.properties.splice(driverIdx, 1)
        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceExpo
export default fn
