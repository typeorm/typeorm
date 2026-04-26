import path from "node:path"
import type { API, FileInfo, UnaryExpression } from "jscodeshift"
import {
    TYPEORM_COLUMN_DECORATORS,
    forEachDecoratorObjectArg,
    getStringValue,
} from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "replace `readonly` column option with `update`"

export const columnReadonly = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    forEachDecoratorObjectArg(
        root,
        j,
        (obj) => {
            for (const prop of obj.properties) {
                if (prop.type !== "ObjectProperty") continue

                const keyName =
                    prop.key.type === "Identifier"
                        ? prop.key.name
                        : getStringValue(prop.key)
                if (keyName !== "readonly") continue

                // readonly: true   → update: false
                // readonly: false  → update: true
                // readonly: <expr> → update: !<expr>
                prop.key = j.identifier("update")
                if (
                    prop.value.type === "BooleanLiteral" ||
                    (prop.value.type === "Literal" &&
                        typeof prop.value.value === "boolean")
                ) {
                    prop.value.value = !prop.value.value
                } else if (
                    prop.value.type === "UnaryExpression" &&
                    prop.value.operator === "!"
                ) {
                    // `readonly: !flag` → `update: flag` (strip the existing
                    // NOT rather than double-negating).
                    prop.value = prop.value.argument
                } else {
                    // `readonly: someVar` / `readonly: obj.flag` → `update: !(…)`
                    prop.value = j.unaryExpression(
                        "!",
                        prop.value as UnaryExpression["argument"],
                        true,
                    )
                }
                hasChanges = true
            }
        },
        TYPEORM_COLUMN_DECORATORS,
    )

    return hasChanges ? root.toSource() : undefined
}

export const fn = columnReadonly
export default fn
