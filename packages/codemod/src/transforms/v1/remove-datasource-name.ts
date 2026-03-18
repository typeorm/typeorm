import type { API, FileInfo } from "jscodeshift"

export const description =
    "remove deprecated `name` property from DataSource options"

export const removeDatasourceName = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // Look for `name` property inside object literals passed to new DataSource()
    // or DataSource options objects
    root.find(j.NewExpression, {
        callee: { type: "Identifier", name: "DataSource" },
    }).forEach((path) => {
        const arg = path.node.arguments[0]
        if (arg?.type !== "ObjectExpression") return

        const filtered = arg.properties.filter((prop) => {
            if (
                prop.type === "ObjectProperty" &&
                prop.key.type === "Identifier" &&
                prop.key.name === "name"
            ) {
                hasChanges = true
                return false
            }
            return true
        })

        if (filtered.length !== arg.properties.length) {
            arg.properties = filtered
        }
    })

    // Also handle standalone objects with `type` and `name` properties
    // (likely DataSource options assigned to variables)
    root.find(j.ObjectExpression).forEach((path) => {
        const props = path.node.properties
        const hasType = props.some(
            (p) =>
                p.type === "ObjectProperty" &&
                p.key.type === "Identifier" &&
                p.key.name === "type",
        )

        if (!hasType) return

        const filtered = props.filter((prop) => {
            if (
                prop.type === "ObjectProperty" &&
                prop.key.type === "Identifier" &&
                prop.key.name === "name"
            ) {
                hasChanges = true
                return false
            }
            return true
        })

        if (filtered.length !== props.length) {
            path.node.properties = filtered
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default removeDatasourceName
