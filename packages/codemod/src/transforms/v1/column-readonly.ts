import type { API, FileInfo } from "jscodeshift"
import { forEachDecoratorObjectArg } from "../ast-helpers"

export const description = "replace `readonly` column option with `update`"

export const columnReadonly = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    forEachDecoratorObjectArg(root, j, (obj) => {
        for (const prop of obj.properties) {
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
    })

    return hasChanges ? root.toSource() : undefined
}

export default columnReadonly
