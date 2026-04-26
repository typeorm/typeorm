import path from "node:path"
import type { API, FileInfo, ObjectExpression } from "jscodeshift"
import { getStringValue, removeObjectProperties } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "rename `busyTimeout` to `timeout` and remove `flags` in SQLite config"

// TypeORM driver type values that share the SQLite `busyTimeout` / `flags`
// option shape. Scoping mutations to objects carrying one of these `type`
// values keeps the transform from touching unrelated configs (e.g. commander
// options, another library's settings) that happen to reuse the same keys.
const sqliteFamilyTypes = new Set([
    "sqlite",
    "better-sqlite3",
    "sqljs",
    "capacitor",
    "cordova",
    "react-native",
    "nativescript",
    "expo",
])

const isSqliteOptions = (obj: ObjectExpression): boolean => {
    for (const prop of obj.properties) {
        if (prop.type !== "Property" && prop.type !== "ObjectProperty") {
            continue
        }
        const keyName =
            prop.key.type === "Identifier"
                ? prop.key.name
                : getStringValue(prop.key)
        if (keyName !== "type") continue
        const value = getStringValue(prop.value)
        return value !== null && sqliteFamilyTypes.has(value)
    }
    return false
}

export const datasourceSqliteOptions = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    let hasChanges = false

    root.find(j.ObjectExpression).forEach((objPath) => {
        if (!isSqliteOptions(objPath.node)) return

        for (const prop of objPath.node.properties) {
            if (prop.type !== "Property" && prop.type !== "ObjectProperty") {
                continue
            }
            const keyName =
                prop.key.type === "Identifier"
                    ? prop.key.name
                    : getStringValue(prop.key)
            if (keyName !== "busyTimeout") continue
            // Replace the key with an identifier — `"timeout"` doesn't need
            // quoting and prettier would strip the quotes anyway.
            prop.key = j.identifier("timeout")
            hasChanges = true
        }

        if (removeObjectProperties(objPath.node, new Set(["flags"]))) {
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceSqliteOptions
export default fn
