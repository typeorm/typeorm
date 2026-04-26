import path from "node:path"
import type { API, ASTPath, FileInfo, Node } from "jscodeshift"
import { removeImportSpecifiers } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `ConnectionManager` class for manual migration to direct `DataSource` instantiation"
export const manual = true

const MESSAGE = `\`ConnectionManager\` was removed — create and manage \`DataSource\` instances directly instead — there is no replacement class`

// A TODO attached to one of these nodes will survive jscodeshift/recast's
// printing. Walking up until we reach one of these produces a visible
// comment above the enclosing statement or declaration.
const isTodoHost = (type: string): boolean =>
    type.endsWith("Statement") ||
    type === "VariableDeclaration" ||
    type === "ExportDefaultDeclaration" ||
    type === "ExportNamedDeclaration" ||
    type === "ClassProperty" ||
    type === "PropertyDefinition"

export const connectionManager = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    // Collect local aliases bound to the typeorm `ConnectionManager` class
    // so aliased imports like `import { ConnectionManager as CM }` are
    // correctly matched.
    const localNames = new Set<string>()
    root.find(j.ImportDeclaration, {
        source: { value: "typeorm" },
    }).forEach((p) => {
        for (const s of p.node.specifiers ?? []) {
            if (
                s.type === "ImportSpecifier" &&
                s.imported.type === "Identifier" &&
                s.imported.name === "ConnectionManager"
            ) {
                const local = s.local?.name
                localNames.add(
                    typeof local === "string" ? local : s.imported.name,
                )
            }
        }
    })

    if (localNames.size === 0) {
        // Not imported from typeorm; nothing to flag.
        return undefined
    }

    const flagEnclosingStatement = (startPath: ASTPath): void => {
        let current = startPath.parent
        while (current) {
            const node: Node = current.node
            if (isTodoHost(node.type)) {
                if (!hasTodoComment(node, MESSAGE)) {
                    addTodoComment(node, MESSAGE, j)
                    hasChanges = true
                    hasTodos = true
                }
                return
            }
            current = current.parent
        }
    }

    // Flag `new ConnectionManager(...)` constructions wherever they appear
    root.find(j.NewExpression)
        .filter((p) => {
            const callee = p.node.callee
            return (
                callee.type === "Identifier" &&
                localNames.has((callee as { name: string }).name)
            )
        })
        .forEach(flagEnclosingStatement)

    // Flag `: ConnectionManager` type annotations too; otherwise a file
    // that only uses the class as a type would have its import silently
    // removed and be left with a broken reference.
    root.find(j.TSTypeReference)
        .filter((p) => {
            const typeName = p.node.typeName
            return (
                typeName.type === "Identifier" &&
                localNames.has((typeName as { name: string }).name)
            )
        })
        .forEach(flagEnclosingStatement)

    // Only drop the import when at least one usage was successfully
    // flagged — leaving a dangling `ConnectionManager` reference without a
    // TODO would be worse than leaving the deprecated import in place.
    if (hasTodos) {
        if (
            removeImportSpecifiers(
                root,
                j,
                "typeorm",
                new Set(["ConnectionManager"]),
            )
        ) {
            hasChanges = true
        }
        stats.count.todo(api, name, file)
    }

    return hasChanges ? root.toSource() : undefined
}

export const fn = connectionManager
export default fn
