import type { API, FileInfo } from "jscodeshift"
import { renameMemberMethod } from "../ast-helpers"

export const description = "rename `Repository.exist()` to `exists()`"

export const repositoryExist = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    const hasChanges = renameMemberMethod(root, j, "exist", "exists")

    return hasChanges ? root.toSource() : undefined
}

export default repositoryExist
