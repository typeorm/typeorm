import type { API, FileInfo } from "jscodeshift"

export const description =
    "remove deprecated `name` property from DataSource options"

export const removeDatasourceName = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const removeNameFromObject = (arg: any) => {
        if (arg?.type !== "ObjectExpression") return

        const filtered = arg.properties.filter((prop: any) => {
            if (
                (prop.type === "Property" || prop.type === "ObjectProperty") &&
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
    }

    // new DataSource({ name: ... })
    root.find(j.NewExpression, {
        callee: { type: "Identifier", name: "DataSource" },
    }).forEach((path) => {
        removeNameFromObject(path.node.arguments[0])
    })

    // new Connection({ name: ... })
    root.find(j.NewExpression, {
        callee: { type: "Identifier", name: "Connection" },
    }).forEach((path) => {
        removeNameFromObject(path.node.arguments[0])
    })

    // createConnection({ name: ... })
    root.find(j.CallExpression, {
        callee: { type: "Identifier", name: "createConnection" },
    }).forEach((path) => {
        removeNameFromObject(path.node.arguments[0])
    })

    return hasChanges ? root.toSource() : undefined
}

export default removeDatasourceName
