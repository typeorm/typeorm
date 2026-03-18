import type { API, FileInfo } from "jscodeshift"

export const description =
    "remove deprecated `connectorPackage` option from MySQL config"

export const removeConnectorPackage = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    root.find(j.ObjectProperty, {
        key: { type: "Identifier", name: "connectorPackage" },
    }).forEach((path) => {
        j(path).remove()
        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export default removeConnectorPackage
