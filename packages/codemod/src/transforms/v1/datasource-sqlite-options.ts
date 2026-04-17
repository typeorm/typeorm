import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "rename `busyTimeout` to `timeout` and remove `flags` in SQLite config"

export const datasourceSqliteOptions = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    // Only operate on files that import from typeorm — avoid mutating
    // unrelated `busyTimeout` / `flags` properties in other libraries' configs
    if (!fileImportsFrom(root, j, "typeorm")) return undefined

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

export const fn = datasourceSqliteOptions
export default fn
