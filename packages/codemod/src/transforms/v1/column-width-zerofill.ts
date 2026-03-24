import type { API, FileInfo } from "jscodeshift"

export const description =
    "remove `width` and `zerofill` from `@Column` options"

export const columnWidthZerofill = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const propsToRemove = new Set(["width", "zerofill"])

    // jscodeshift does not traverse into decorator expressions,
    // so we find ClassProperty nodes and inspect their decorators manually.
    root.find(j.ClassProperty).forEach((path) => {
        const decorators = (path.node as any).decorators as any[] | undefined
        if (!decorators) return

        for (const decorator of decorators) {
            if (
                decorator.type !== "Decorator" ||
                decorator.expression.type !== "CallExpression"
            ) {
                continue
            }

            for (const arg of decorator.expression.arguments) {
                if (arg.type !== "ObjectExpression") continue

                const filtered = arg.properties.filter((prop: any) => {
                    if (
                        (prop.type === "Property" ||
                            prop.type === "ObjectProperty") &&
                        prop.key.type === "Identifier" &&
                        propsToRemove.has(prop.key.name)
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
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default columnWidthZerofill
