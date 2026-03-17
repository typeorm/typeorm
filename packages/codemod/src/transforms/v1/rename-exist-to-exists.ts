import type { API, FileInfo } from "jscodeshift"

/**
 * Renames .exist() to .exists() on Repository/EntityManager.
 */
export const renameExistToExists = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: "exist" },
        },
    }).forEach((path) => {
        if (
            path.node.callee.type === "MemberExpression" &&
            path.node.callee.property.type === "Identifier"
        ) {
            path.node.callee.property.name = "exists"
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default renameExistToExists
