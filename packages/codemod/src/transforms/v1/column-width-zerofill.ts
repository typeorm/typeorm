import path from "node:path"
import type { API, FileInfo, ObjectExpression } from "jscodeshift"
import {
    TYPEORM_COLUMN_DECORATORS,
    expandLocalNamesForImports,
    forEachColumnMetadataOptionsArg,
    forEachDecoratorObjectArg,
    removeObjectProperties,
} from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "remove `width` and `zerofill` from `@Column` options"

const propsToRemove = new Set(["width", "zerofill"])

export const columnWidthZerofill = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const stripWidthAndZerofill = (obj: ObjectExpression): void => {
        if (removeObjectProperties(obj, propsToRemove)) {
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
        stripWidthAndZerofill,
        decoratorLocalNames,
    )

    // Also strip from `new ColumnMetadata({ args: { options: { width, zerofill, … } } })`.
    // `ColumnMetadataArgs.options` is typed `ColumnOptions`, which no longer
    // has `width` or `zerofill` in v1. `valueOnly` skips `import type` bindings
    // — `new X(...)` needs a runtime binding, not a type alias.
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
        stripWidthAndZerofill,
    )

    return hasChanges ? root.toSource() : undefined
}

export const fn = columnWidthZerofill
export default fn
