import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import {
    collectRepositoryBindings,
    fileImportsFrom,
    isRepositoryReceiver,
} from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "rename `Repository.exist()` to `exists()`"

export const repositoryExist = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    const bindings = collectRepositoryBindings(root, j)

    let hasChanges = false

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "exist" },
        },
    }).forEach((callPath) => {
        const callee = callPath.node.callee
        if (callee.type !== "MemberExpression") return
        if (callee.property.type !== "Identifier") return
        if (!isRepositoryReceiver(callee.object, bindings)) return
        callee.property.name = "exists"
        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = repositoryExist
export default fn
