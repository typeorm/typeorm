import type { API, FileInfo } from "jscodeshift"

export const description = "replace `readonly` column option with `update`"

export const replaceReadonlyColumn = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    root.find(j.ObjectProperty, {
        key: { name: "readonly" },
    }).forEach((path) => {
        // Only transform if it's inside a decorator-like options object
        // Check if parent is an ObjectExpression that's an argument to a call
        const parent = path.parent
        if (parent.node.type !== "ObjectExpression") return

        const grandparent = parent.parent
        if (
            grandparent.node.type !== "CallExpression" &&
            grandparent.node.type !== "ArrayExpression"
        ) {
            return
        }

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
