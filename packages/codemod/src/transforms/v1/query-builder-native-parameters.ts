import type { API, FileInfo } from "jscodeshift"

export const description = "rename `setNativeParameters()` to `setParameters()`"

export const queryBuilderNativeParameters = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: "setNativeParameters" },
        },
    }).forEach((path) => {
        if (
            path.node.callee.type === "MemberExpression" &&
            path.node.callee.property.type === "Identifier"
        ) {
            path.node.callee.property.name = "setParameters"
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default queryBuilderNativeParameters
