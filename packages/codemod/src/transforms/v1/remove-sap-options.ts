import type { API, FileInfo } from "jscodeshift"

export const description =
    "rename and remove deprecated SAP HANA connection options"

export const removeSapOptions = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
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

    // Rename top-level options
    root.find(j.ObjectProperty).forEach((path) => {
        if (path.node.key.type !== "Identifier") return

        const name = path.node.key.name

        // Top-level renames
        if (topLevelRenames[name]) {
            path.node.key.name = topLevelRenames[name]
            hasChanges = true
            return
        }

        // Pool property handling — check if inside a pool object
        if (poolRenames[name] || poolRemoves.has(name)) {
            const parent = path.parent
            if (parent.node.type !== "ObjectExpression") return

            const grandparent = parent.parent
            if (
                grandparent.node.type !== "ObjectProperty" ||
                grandparent.node.key.type !== "Identifier" ||
                grandparent.node.key.name !== "pool"
            ) {
                return
            }

            if (poolRemoves.has(name)) {
                j(path).remove()
                hasChanges = true
            } else if (poolRenames[name]) {
                path.node.key.name = poolRenames[name]
                hasChanges = true
            }
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default removeSapOptions
