import path from "node:path"
import type { API, ASTNode, FileInfo, ObjectProperty } from "jscodeshift"
import { fileImportsFrom, getStringValue, setStringValue } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "rename and remove deprecated SAP HANA connection options"

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

    // Rename top-level options
    root.find(j.ObjectProperty).forEach((path) => {
        const name = getKeyName(path.node.key)
        if (name === null) return

        // Top-level renames
        if (topLevelRenames[name]) {
            renameKey(path.node.key, topLevelRenames[name])
            hasChanges = true
            return
        }

        // Pool property handling — check if inside a pool object
        if (poolRenames[name] || poolRemoves.has(name)) {
            const parent = path.parent
            if (parent.node.type !== "ObjectExpression") return

            const grandparent = parent.parent
            if (grandparent.node.type !== "ObjectProperty") return
            const gpNode = grandparent.node as ObjectProperty
            if (getKeyName(gpNode.key) !== "pool") return

            if (poolRemoves.has(name)) {
                j(path).remove()
                hasChanges = true
            } else if (poolRenames[name]) {
                renameKey(path.node.key, poolRenames[name])
                hasChanges = true
            }
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceSap
export default fn
