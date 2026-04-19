import path from "node:path"
import type {
    API,
    ASTPath,
    Collection,
    ExportNamedDeclaration,
    FileInfo,
    ImportDeclaration,
    ImportSpecifier,
    JSCodeshift,
} from "jscodeshift"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "move `ObjectId` import from `typeorm` to `mongodb`"

// jscodeshift's typings omit the Babel `exportKind` flag on
// ExportNamedDeclaration even though the runtime node carries it
// ("value" / "type"). Narrow a local alias rather than spreading
// intersection casts through the transform.
type ExportDeclarationWithKind = ExportNamedDeclaration & {
    exportKind?: "value" | "type"
}

const addToExistingImport = (
    existing: ASTPath<ImportDeclaration>,
    movedSpecifiers: ImportSpecifier[],
) => {
    const existingNames = new Set(
        existing.node.specifiers
            ?.filter(
                (s): s is ImportSpecifier =>
                    s.type === "ImportSpecifier" &&
                    s.imported.type === "Identifier",
            )
            .map((s) => s.imported.name) ?? [],
    )

    for (const spec of movedSpecifiers) {
        if (!existingNames.has(spec.imported.name)) {
            existing.node.specifiers?.push(spec)
        }
    }
}

const createNewImport = (
    j: JSCodeshift,
    root: Collection,
    importPath: ASTPath<ImportDeclaration>,
    movedSpecifiers: ImportSpecifier[],
) => {
    const newImport = j.importDeclaration(
        movedSpecifiers,
        j.stringLiteral("mongodb"),
    )

    if (importPath.node.importKind === "type") {
        newImport.importKind = "type"
    }

    const allImports = root.find(j.ImportDeclaration)
    if (allImports.length > 0) {
        const lastImport: ASTPath<ImportDeclaration> = allImports.at(-1).get()
        j(lastImport).insertAfter(newImport)
    } else {
        root.find(j.Program).forEach((p) => {
            p.node.body.unshift(newImport)
        })
    }
}

export const mongodbTypes = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const movedTypes = new Set(["ObjectId"])

    root.find(j.ImportDeclaration, {
        source: { value: "typeorm" },
    }).forEach((importPath) => {
        const movedSpecifiers: ImportSpecifier[] = []
        const remaining = importPath.node.specifiers?.filter((spec) => {
            if (
                spec.type === "ImportSpecifier" &&
                spec.imported.type === "Identifier" &&
                movedTypes.has(spec.imported.name)
            ) {
                movedSpecifiers.push(spec)
                return false
            }
            return true
        })

        if (movedSpecifiers.length === 0) return

        hasChanges = true

        // Update or remove the typeorm import
        if (remaining?.length === 0) {
            j(importPath).remove()
        } else if (remaining) {
            importPath.node.specifiers = remaining
        }

        // Check if there's already a mongodb import
        const existingMongoImport = root.find(j.ImportDeclaration, {
            source: { value: "mongodb" },
        })

        if (existingMongoImport.length > 0) {
            const mongoImport: ASTPath<ImportDeclaration> = existingMongoImport
                .at(0)
                .get()
            addToExistingImport(mongoImport, movedSpecifiers)
        } else {
            createNewImport(j, root, importPath, movedSpecifiers)
        }
    })

    // Move re-exports from typeorm to mongodb (barrel-file pattern).
    // `export { ObjectId } from "typeorm"` → `export { ObjectId } from "mongodb"`.
    root.find(j.ExportNamedDeclaration, {
        source: { value: "typeorm" },
    }).forEach((exportPath) => {
        const moved: typeof exportPath.node.specifiers = []
        const remaining = exportPath.node.specifiers?.filter((spec) => {
            if (
                spec.type === "ExportSpecifier" &&
                spec.local?.type === "Identifier" &&
                movedTypes.has(spec.local.name)
            ) {
                moved.push(spec)
                return false
            }
            return true
        })

        if (moved.length === 0) return
        hasChanges = true

        if (remaining?.length === 0) {
            j(exportPath).remove()
        } else if (remaining) {
            exportPath.node.specifiers = remaining
        }

        // Merge into an existing `export { ... } from "mongodb"` if present —
        // appending a fresh declaration unconditionally would produce a
        // duplicate named export and fail at parse time. Skip type-only
        // declarations (`export type { ... }`) because `ObjectId` is a runtime
        // value; merging into a type-only export would strip its runtime form.
        const sourceNode: ExportDeclarationWithKind = exportPath.node
        const existingMongoExport = root
            .find(j.ExportNamedDeclaration, {
                source: { value: "mongodb" },
            })
            .filter(
                (p) =>
                    (p.node as ExportDeclarationWithKind).exportKind !== "type",
            )
        if (existingMongoExport.length > 0) {
            const existingPath = existingMongoExport.at(0).get() as ASTPath<
                typeof exportPath.node
            >
            const existingNames = new Set(
                existingPath.node.specifiers
                    ?.filter(
                        (s) =>
                            s.type === "ExportSpecifier" &&
                            s.local?.type === "Identifier",
                    )
                    .map((s) => s.local?.name ?? "") ?? [],
            )
            for (const spec of moved) {
                if (
                    spec.type === "ExportSpecifier" &&
                    spec.local?.type === "Identifier" &&
                    !existingNames.has(spec.local.name)
                ) {
                    existingPath.node.specifiers?.push(spec)
                }
            }
        } else {
            const newExport: ExportDeclarationWithKind =
                j.exportNamedDeclaration(
                    null,
                    moved,
                    j.stringLiteral("mongodb"),
                )
            // Preserve the source declaration's exportKind so moved `export type`
            // specifiers don't get silently promoted to value exports.
            if (sourceNode.exportKind) {
                newExport.exportKind = sourceNode.exportKind
            }
            exportPath.insertAfter(newExport)
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = mongodbTypes
export default fn
