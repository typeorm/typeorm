import type { API, FileInfo } from "jscodeshift"

export const description = "replace `readonly` column option with `update`"

export const columnReadonly = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

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

                for (const prop of arg.properties) {
                    if (
                        prop.type === "ObjectProperty" &&
                        prop.key.type === "Identifier" &&
                        prop.key.name === "readonly"
                    ) {
                        // readonly: true → update: false
                        // readonly: false → update: true
                        prop.key.name = "update"
                        if (
                            prop.value.type === "BooleanLiteral" ||
                            (prop.value.type === "Literal" &&
                                typeof prop.value.value === "boolean")
                        ) {
                            prop.value.value = !prop.value.value
                        }
                        hasChanges = true
                    }
                }
            }
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default columnReadonly
