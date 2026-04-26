import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "remove deprecated `connectorPackage` option from MySQL config"

export const datasourceMysqlConnector = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false

    root.find(j.ObjectProperty, {
        key: { type: "Identifier", name: "connectorPackage" },
    }).forEach((path) => {
        j(path).remove()
        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceMysqlConnector
export default fn
