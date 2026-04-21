import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "replace `findByIds()` with `findBy()` and `In` operator"

export const repositoryFindByIds = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let needsInImport = false

    if (!fileImportsFrom(root, j, "typeorm")) {
        return undefined
    }

    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { name: "findByIds" },
        },
    }).forEach((path) => {
        if (
            path.node.callee.type !== "MemberExpression" ||
            path.node.arguments.length !== 1
        ) {
            return
        }

        const idsArg = path.node.arguments[0]

        // Replace .findByIds(ids) with .findBy({ id: In(ids) })
        path.node.callee.property = j.identifier("findBy")
        path.node.arguments = [
            j.objectExpression([
                j.property(
                    "init",
                    j.identifier("id"),
                    j.callExpression(j.identifier("In"), [idsArg]),
                ),
            ]),
        ]

        hasChanges = true
        needsInImport = true
    })

    if (needsInImport) {
        const typeormImports = root.find(j.ImportDeclaration, {
            source: { value: "typeorm" },
        })

        let hasInImport = false
        typeormImports.forEach((path) => {
            path.node.specifiers?.forEach((spec) => {
                if (
                    spec.type === "ImportSpecifier" &&
                    spec.imported.type === "Identifier" &&
                    spec.imported.name === "In"
                ) {
                    hasInImport = true
                }
            })
        })

        if (!hasInImport) {
            if (typeormImports.length > 0) {
                typeormImports.at(0).forEach((path) => {
                    path.node.specifiers?.push(
                        j.importSpecifier(j.identifier("In")),
                    )
                })
            } else {
                const newImport = j.importDeclaration(
                    [j.importSpecifier(j.identifier("In"))],
                    j.literal("typeorm"),
                )
                root.find(j.ImportDeclaration).at(-1).insertAfter(newImport)
            }
        }
    }

    return hasChanges ? root.toSource() : undefined
}

export const fn = repositoryFindByIds
export default fn
