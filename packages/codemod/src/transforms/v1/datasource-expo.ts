import path from "node:path"
import type {
    API,
    ASTNode,
    CallExpression,
    FileInfo,
    Node,
    ObjectExpression,
} from "jscodeshift"
import {
    fileImportsFrom,
    getObjectPropertyKeyName,
    getStringValue,
    removeObjectPropertiesWhere,
} from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "remove redundant `expo-sqlite` driver injection on Expo data sources — v1 auto-loads it"

// Unwraps `as const` / `as X` / `!` / `satisfies X` / angle-bracket casts
// around a value so `type: "expo" as const` is recognized alongside plain
// `type: "expo"`. Without this, `isExpoDataSource` would miss factory
// configs that narrow the literal type before spreading.
const unwrapTsExpression = (node: ASTNode): ASTNode => {
    let current: ASTNode = node
    while (
        current.type === "TSAsExpression" ||
        current.type === "TSNonNullExpression" ||
        current.type === "TSSatisfiesExpression" ||
        current.type === "TSTypeAssertion"
    ) {
        current = (current as unknown as { expression: ASTNode }).expression
    }
    return current
}

// Scope predicate: `{ type: "expo", database: "...", ... }`. The sibling
// `database` requirement avoids mutating unrelated configs that merely reuse
// `type: "expo"` (e.g. commander/yargs option shapes).
const isExpoDataSource = (obj: ObjectExpression): boolean => {
    let hasExpoType = false
    let hasDatabase = false
    for (const prop of obj.properties) {
        const keyName = getObjectPropertyKeyName(prop)
        if (!keyName) continue
        if (prop.type !== "Property" && prop.type !== "ObjectProperty") continue
        if (
            keyName === "type" &&
            getStringValue(unwrapTsExpression(prop.value)) === "expo"
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

        // Delete the redundant `driver: require("expo-sqlite")` — v1 auto-loads
        // it. Users with custom wrappers / patch-package overrides fall through
        // `isDefaultExpoSqliteRequire` and keep their explicit line.
        const removed = removeObjectPropertiesWhere(obj, (prop) => {
            if (getObjectPropertyKeyName(prop) !== "driver") return false
            if (prop.type !== "Property" && prop.type !== "ObjectProperty")
                return false
            return isDefaultExpoSqliteRequire(prop.value as Node)
        })
        if (removed) hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceExpo
export default fn
