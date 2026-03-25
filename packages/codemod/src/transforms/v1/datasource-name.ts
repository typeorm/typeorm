import type { API, ASTNode, FileInfo } from "jscodeshift"
import { removeObjectProperties } from "../ast-helpers"

export const description =
    "remove deprecated `name` property from DataSource options"

const propertyNames = new Set(["name"])

export const datasourceName = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const removeNameFromObject = (arg: ASTNode | undefined) => {
        if (arg?.type !== "ObjectExpression") return

        if (removeObjectProperties(arg, propertyNames)) {
            hasChanges = true
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

export default datasourceName
