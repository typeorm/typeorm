import type { API, FileInfo } from "jscodeshift"
import { renameMemberMethod } from "../ast-helpers"

export const description = "rename `printSql()` to `logQuery()`"

export const queryBuilderPrintSql = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    const hasChanges = renameMemberMethod(root, j, "printSql", "logQuery")

    return hasChanges ? root.toSource() : undefined
}

export default queryBuilderPrintSql
