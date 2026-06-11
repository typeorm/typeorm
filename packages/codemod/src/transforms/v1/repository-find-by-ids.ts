import path from "node:path"
import type {
    API,
    Collection,
    FileInfo,
    ImportDeclaration,
    JSCodeshift,
} from "jscodeshift"
import {
    collectRepositoryBindings,
    fileImportsFrom,
    isRepositoryReceiver,
} from "../ast-helpers"

// A typeorm import declaration that we can safely augment with a new named
// value specifier. Rejects:
//   - `import type { ... } from "typeorm"` (declaration-level type-only)
//   - `import "typeorm"` (side-effect only, no specifiers)
//   - `import * as typeorm from "typeorm"` (namespace only — pushing a named
//     specifier would produce `import * as typeorm, { In }` which is invalid)
//   - `import typeorm from "typeorm"` (default only — same issue)
// Only a decl that already carries at least one value-level ImportSpecifier
// (named import) is considered augmentable.
const canAcceptNamedValueSpecifier = (node: {
    importKind?: string
    specifiers?: readonly { type: string; importKind?: string }[]
}): boolean => {
    if (node.importKind === "type") return false
    const specifiers = node.specifiers ?? []
    if (specifiers.length === 0) return false
    return specifiers.some(
        (s) => s.type === "ImportSpecifier" && s.importKind !== "type",
    )
}

// `In` is used as a VALUE (`In([...])`) — it must not be added to a
// `import type { ... } from "typeorm"` declaration, and the per-specifier
// form `import { type In }` is equally unusable. Find the first existing
// value-level `In` binding or an augmentable value-level typeorm import;
// fall back to emitting a fresh `import { In } from "typeorm"` line.
const ensureInValueImport = (root: Collection, j: JSCodeshift): void => {
    const typeormImports = root.find(j.ImportDeclaration, {
        source: { value: "typeorm" },
    })

    let hasInValueImport = false
    typeormImports.forEach((p) => {
        const declTypeOnly =
            (p.node as { importKind?: string }).importKind === "type"
        p.node.specifiers?.forEach((spec) => {
            if (
                spec.type === "ImportSpecifier" &&
                spec.imported.type === "Identifier" &&
                spec.imported.name === "In"
            ) {
                const specTypeOnly =
                    (spec as { importKind?: string }).importKind === "type"
                if (!declTypeOnly && !specTypeOnly) hasInValueImport = true
            }
        })
    })
    if (hasInValueImport) return

    let augmented = false
    typeormImports.forEach((p) => {
        if (augmented) return
        if (!canAcceptNamedValueSpecifier(p.node)) return
        p.node.specifiers?.push(j.importSpecifier(j.identifier("In")))
        augmented = true
    })
    if (augmented) return

    const newImport: ImportDeclaration = j.importDeclaration(
        [j.importSpecifier(j.identifier("In"))],
        j.literal("typeorm"),
    )
    const allImports = root.find(j.ImportDeclaration)
    if (allImports.length > 0) {
        allImports.at(-1).insertAfter(newImport)
    } else {
        root.find(j.Program).forEach((p) => {
            p.node.body.unshift(newImport)
        })
    }
}

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

    const bindings = collectRepositoryBindings(root, j)

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

        if (!isRepositoryReceiver(path.node.callee.object, bindings)) return

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
        ensureInValueImport(root, j)
    }

    return hasChanges ? root.toSource() : undefined
}

export const fn = repositoryFindByIds
export default fn
