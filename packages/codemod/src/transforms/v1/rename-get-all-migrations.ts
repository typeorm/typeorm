import type { API, FileInfo } from "jscodeshift"

/**
 * Renames .getAllMigrations() to .getMigrations().
 */
export const renameGetAllMigrations = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: "getAllMigrations" },
        },
    }).forEach((path) => {
        if (
            path.node.callee.type === "MemberExpression" &&
            path.node.callee.property.type === "Identifier"
        ) {
            path.node.callee.property.name = "getMigrations"
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default renameGetAllMigrations
