import path from "node:path"
import type { API, FileInfo } from "jscodeshift"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "rename DataSource#dropDatabase() to DataSource#dropAllEntityTables()"

export const datasourceDropDatabase = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // DataSource#dropDatabase() takes no arguments.
    // QueryRunner#dropDatabase(name, ifExists?) always takes at least one argument.
    // Match only the zero-argument form so QueryRunner calls are left alone.
    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: "dropDatabase" },
        },
    }).forEach((path) => {
        if (path.node.arguments.length !== 0) return
        if (
            path.node.callee.type === "MemberExpression" &&
            path.node.callee.property.type === "Identifier"
        ) {
            path.node.callee.property.name = "dropAllEntityTables"
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceDropDatabase
export default fn
