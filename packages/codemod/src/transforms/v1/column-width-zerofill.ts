import type { ASTNode, API, FileInfo } from "jscodeshift"
import { forEachDecoratorObjectArg } from "../ast-helpers"

export const description =
    "remove `width` and `zerofill` from `@Column` options"

export const columnWidthZerofill = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const propsToRemove = new Set(["width", "zerofill"])

    forEachDecoratorObjectArg(root, j, (arg) => {
        const obj = arg as ASTNode & {
            properties: {
                type: string
                key: { type: string; name: string }
            }[]
        }

        const filtered = obj.properties.filter((prop) => {
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

        if (filtered.length !== obj.properties.length) {
            obj.properties = filtered
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default columnWidthZerofill
