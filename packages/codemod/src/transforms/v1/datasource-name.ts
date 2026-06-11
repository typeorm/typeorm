import path from "node:path"
import type { API, ASTNode, FileInfo } from "jscodeshift"
import {
    expandLocalNamesForImports,
    fileImportsFrom,
    removeObjectProperties,
} from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "remove deprecated `name` property from DataSource options"

const propertyNames = new Set(["name"])

export const datasourceName = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    // Restrict matches to local bindings that resolve to TypeORM's
    // DataSource/Connection types or `createConnection`. Without this, a
    // user class called `Connection` or a `createConnection` from an unrelated
    // package would have its `{ name }` option silently stripped.
    const dataSourceNames = expandLocalNamesForImports(
        root,
        j,
        "typeorm",
        new Set(["DataSource", "Connection"]),
    )
    const createConnectionNames = expandLocalNamesForImports(
        root,
        j,
        "typeorm",
        new Set(["createConnection"]),
    )
    if (dataSourceNames.size === 0 && createConnectionNames.size === 0)
        return undefined

    let hasChanges = false

    const removeNameFromObject = (arg: ASTNode | undefined) => {
        if (arg?.type !== "ObjectExpression") return
        if (removeObjectProperties(arg, propertyNames)) {
            hasChanges = true
        }
    }

    root.find(j.NewExpression).forEach((path) => {
        const callee = path.node.callee
        if (callee.type !== "Identifier" || !dataSourceNames.has(callee.name))
            return
        removeNameFromObject(path.node.arguments[0])
    })

    root.find(j.CallExpression).forEach((path) => {
        const callee = path.node.callee
        if (
            callee.type !== "Identifier" ||
            !createConnectionNames.has(callee.name)
        )
            return
        removeNameFromObject(path.node.arguments[0])
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceName
export default fn
