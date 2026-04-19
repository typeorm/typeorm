import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import {
    TYPEORM_COLUMN_DECORATORS,
    expandLocalNamesForImports,
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

    const decoratorLocalNames = expandLocalNamesForImports(
        root,
        j,
        "typeorm",
        TYPEORM_COLUMN_DECORATORS,
    )
    forEachDecoratorObjectArg(
        root,
        j,
        (obj) => {
            if (removeObjectProperties(obj, propsToRemove)) {
                hasChanges = true
            }
        },
        decoratorLocalNames,
    )

    return hasChanges ? root.toSource() : undefined
}

export const fn = columnWidthZerofill
export default fn
