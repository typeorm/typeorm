import type { API, FileInfo } from "jscodeshift"

/**
 * Removes `width` and `zerofill` properties from @Column options.
 */
export const removeWidthZerofill = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const propsToRemove = new Set(["width", "zerofill"])

    root.find(j.ObjectExpression).forEach((path) => {
        const props = path.node.properties
        const filtered = props.filter((prop) => {
            if (
                prop.type === "Property" &&
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
