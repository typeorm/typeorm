import type { API, FileInfo } from "jscodeshift"
import { renameMemberMethod } from "../ast-helpers"

export const description = "rename `setNativeParameters()` to `setParameters()`"

export const queryBuilderNativeParameters = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    const hasChanges = renameMemberMethod(
        root,
        j,
        "setNativeParameters",
        "setParameters",
    )

    return hasChanges ? root.toSource() : undefined
}

export default queryBuilderNativeParameters
