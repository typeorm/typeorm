import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { fileImportsFrom, renameMemberMethod } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "rename `setNativeParameters()` to `setParameters()`"

export const queryBuilderNativeParameters = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    const hasChanges = renameMemberMethod(
        root,
        j,
        "setNativeParameters",
        "setParameters",
    )

    return hasChanges ? root.toSource() : undefined
}

export const fn = queryBuilderNativeParameters
export default fn
