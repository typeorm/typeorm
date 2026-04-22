import path from "node:path"
import type {
    API,
    FileInfo,
    ObjectExpression,
    UnaryExpression,
} from "jscodeshift"
import {
    TYPEORM_COLUMN_DECORATORS,
    expandLocalNamesForImports,
    forEachColumnMetadataOptionsArg,
    forEachDecoratorObjectArg,
    getStringValue,
} from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "replace `readonly` column option with `update`"

export const columnReadonly = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const rewriteReadonlyInObject = (obj: ObjectExpression): void => {
        for (const prop of obj.properties) {
            if (prop.type !== "ObjectProperty" && prop.type !== "Property") {
                continue
            }

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
    }

    const decoratorLocalNames = expandLocalNamesForImports(
        root,
        j,
        "typeorm",
        TYPEORM_COLUMN_DECORATORS,
    )
    forEachDecoratorObjectArg(
        root,
        j,
        rewriteReadonlyInObject,
        decoratorLocalNames,
    )

    // Also rewrite `new ColumnMetadata({ args: { options: { readonly, … } } })`.
    // `ColumnMetadataArgs.options` is typed `ColumnOptions`, so the same
    // `readonly` → `update` rename applies. `valueOnly` skips `import type`
    // bindings — `new X(...)` needs a runtime binding, not a type alias.
    const columnMetadataLocalNames = expandLocalNamesForImports(
        root,
        j,
        "typeorm",
        new Set(["ColumnMetadata"]),
        { valueOnly: true },
    )
    forEachColumnMetadataOptionsArg(
        root,
        j,
        columnMetadataLocalNames,
        rewriteReadonlyInObject,
    )

    return hasChanges ? root.toSource() : undefined
}

export const fn = columnReadonly
export default fn
