import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { renameMemberMethod } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "rename `Repository.exist()` to `exists()`"

export const repositoryExist = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    const hasChanges = renameMemberMethod(root, j, "exist", "exists")

    return hasChanges ? root.toSource() : undefined
}

export const fn = repositoryExist
export default fn
