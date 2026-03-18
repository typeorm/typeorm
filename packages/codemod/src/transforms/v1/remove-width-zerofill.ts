import type { API, FileInfo } from "jscodeshift"

export const description =
    "remove `width` and `zerofill` from `@Column` options"

export const removeWidthZerofill = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const propsToRemove = new Set(["width", "zerofill"])

    root.find(j.ObjectExpression).forEach((path) => {
        const props = path.node.properties
        const filtered = props.filter((prop) => {
            if (
                (prop.type === "Property" || prop.type === "ObjectProperty") &&
                prop.key.type === "Identifier" &&
                propsToRemove.has(prop.key.name)
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

export default removeWidthZerofill
