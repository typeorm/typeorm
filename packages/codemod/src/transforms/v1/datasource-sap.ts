import path from "node:path"
import type { API, ASTNode, FileInfo, ObjectExpression } from "jscodeshift"
import {
    fileImportsFrom,
    getStringValue,
    setStringValue,
    unwrapTsExpression,
} from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "rename and remove deprecated SAP HANA connection options"

const getKeyName = (key: ASTNode): string | null => {
    if (key.type === "Identifier") return key.name
    return getStringValue(key)
}

const renameKey = (key: ASTNode, newName: string): void => {
    if (key.type === "Identifier") {
        key.name = newName
    } else {
        setStringValue(key, newName)
    }
}

// Matches `{ type: "sap", ... }` objects — only then are SAP-specific
// option renames safe to apply (avoids clobbering unrelated user code).
// Peels TS wrappers so `type: "sap" as const` also matches.
const isSapOptions = (obj: ObjectExpression): boolean =>
    obj.properties.some(
        (p) =>
            (p.type === "ObjectProperty" || p.type === "Property") &&
            getKeyName(p.key) === "type" &&
            getStringValue(unwrapTsExpression(p.value)) === "sap",
    )

export const datasourceSap = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false

    const topLevelRenames: Record<string, string> = {
        hanaClientDriver: "driver",
    }

    const poolRenames: Record<string, string> = {
        max: "maxConnectedOrPooled",
        requestTimeout: "maxWaitTimeoutIfPoolExhausted",
        idleTimeout: "maxPooledIdleTime",
    }

    const poolRemoves = new Set(["min", "maxWaitingRequests", "checkInterval"])

    root.find(j.ObjectExpression).forEach((objPath) => {
        if (!isSapOptions(objPath.node)) return

        for (const prop of objPath.node.properties) {
            if (prop.type !== "ObjectProperty") continue
            const propName = getKeyName(prop.key)
            if (propName === null) continue

            if (topLevelRenames[propName]) {
                renameKey(prop.key, topLevelRenames[propName])
                hasChanges = true
                continue
            }

            if (propName === "pool" && prop.value.type === "ObjectExpression") {
                const poolObj = prop.value
                const filtered = poolObj.properties.filter((inner) => {
                    if (inner.type !== "ObjectProperty") return true
                    const innerName = getKeyName(inner.key)
                    if (innerName === null) return true
                    if (poolRemoves.has(innerName)) {
                        hasChanges = true
                        return false
                    }
                    if (poolRenames[innerName]) {
                        renameKey(inner.key, poolRenames[innerName])
                        hasChanges = true
                    }
                    return true
                })
                if (filtered.length !== poolObj.properties.length) {
                    poolObj.properties = filtered
                }
            }
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceSap
export default fn
