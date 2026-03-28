import path from "node:path"
import type { API, FileInfo, Identifier } from "jscodeshift"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "replace `findOneById()` with `findOneBy()` using `{ id: value }`"

export const repositoryFindOneById = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: "findOneById" },
        },
    }).forEach((path) => {
        if (
            path.node.callee.type !== "MemberExpression" ||
            path.node.arguments.length < 1
        ) {
            return
        }

        const args = path.node.arguments

        // Two forms:
        // manager.findOneById(Entity, id) — 2 args
        // repository.findOneById(id)      — 1 arg
        path.node.callee.property = j.identifier("findOneBy")

        if (args.length >= 2) {
            // manager.findOneById(Entity, id) → manager.findOneBy(Entity, { id: id })
            const idArg = args[1] as Identifier
            path.node.arguments = [
                args[0],
                j.objectExpression([
                    j.property("init", j.identifier("id"), idArg),
                ]),
            ]
        } else {
            // repository.findOneById(id) → repository.findOneBy({ id: id })
            const idArg = args[0] as Identifier
            path.node.arguments = [
                j.objectExpression([
                    j.property("init", j.identifier("id"), idArg),
                ]),
            ]
        }

        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = repositoryFindOneById
export default fn
