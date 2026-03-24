import type { API, FileInfo } from "jscodeshift"

export const description =
    "rename `busyTimeout` to `timeout` and remove `flags` in SQLite config"

export const datasourceSqliteOptions = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // Rename busyTimeout → timeout
    root.find(j.ObjectProperty, {
        key: { type: "Identifier", name: "busyTimeout" },
    }).forEach((path) => {
        if (path.node.key.type === "Identifier") {
            path.node.key.name = "timeout"
            hasChanges = true
        }
    })

    // Remove flags
    root.find(j.ObjectProperty, {
        key: { type: "Identifier", name: "flags" },
    }).forEach((path) => {
        j(path).remove()
        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export default datasourceSqliteOptions
