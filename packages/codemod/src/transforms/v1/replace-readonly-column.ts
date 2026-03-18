import type { API, FileInfo } from "jscodeshift"

export const description = "replace `readonly` column option with `update`"

export const replaceReadonlyColumn = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    root.find(j.ObjectProperty, {
        key: { name: "readonly" },
    }).forEach((path) => {
        if (path.node.key.type === "Identifier") {
            // readonly: true → update: false
            // readonly: false → update: true
            path.node.key.name = "update"
            if (
                path.node.value.type === "BooleanLiteral" ||
                (path.node.value.type === "Literal" &&
                    typeof path.node.value.value === "boolean")
            ) {
                path.node.value.value = !path.node.value.value
            }
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default replaceReadonlyColumn
