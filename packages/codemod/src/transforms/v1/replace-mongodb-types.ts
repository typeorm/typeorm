import type { API, FileInfo } from "jscodeshift"

export const description = "move `ObjectId` import from `typeorm` to `mongodb`"

export const replaceMongodbTypes = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const movedTypes = new Set(["ObjectId"])

    root.find(j.ImportDeclaration, {
        source: { value: "typeorm" },
    }).forEach((importPath) => {
        const movedSpecifiers: any[] = []
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
        if (remaining && remaining.length === 0) {
            j(importPath).remove()
        } else if (remaining) {
            importPath.node.specifiers = remaining
        }

        // Check if there's already a mongodb import
        const existingMongoImport = root.find(j.ImportDeclaration, {
            source: { value: "mongodb" },
        })

        if (existingMongoImport.length > 0) {
            // Add specifiers to existing mongodb import
            const existing = existingMongoImport.at(0).get()
            const existingNames = new Set(
                existing.node.specifiers
                    ?.filter(
                        (s: any) =>
                            s.type === "ImportSpecifier" &&
                            s.imported.type === "Identifier",
                    )
                    .map((s: any) => s.imported.name) ?? [],
            )

            for (const spec of movedSpecifiers) {
                if (!existingNames.has(spec.imported.name)) {
                    existing.node.specifiers?.push(spec)
                }
            }
        } else {
            // Create new mongodb import
            const newImport = j.importDeclaration(
                movedSpecifiers,
                j.stringLiteral("mongodb"),
            )

            // Check if the original import was a type import
            const isTypeImport = importPath.node.importKind === "type"
            if (isTypeImport) {
                newImport.importKind = "type"
            }

            // Insert after the last import
            const allImports = root.find(j.ImportDeclaration)
            if (allImports.length > 0) {
                j(allImports.at(-1).get()).insertAfter(newImport)
            } else {
                root.get().node.program.body.unshift(newImport)
            }
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default replaceMongodbTypes
