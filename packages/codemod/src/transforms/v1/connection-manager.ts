import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { removeImportSpecifiers } from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag removed `ConnectionManager` class for manual migration to direct `DataSource` instantiation"
export const manual = true

const MIGRATION_HINT =
    "create and manage `DataSource` instances directly instead — there is no replacement class"

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

    // Flag `new ConnectionManager(...)` (or aliased) constructions
    root.find(j.NewExpression)
        .filter((p) => {
            const callee = p.node.callee
            return (
                callee.type === "Identifier" &&
                localNames.has((callee as { name: string }).name)
            )
        })
        .forEach((newPath) => {
            let current = newPath.parent
            while (current) {
                const node: Node = current.node
                if (
                    node.type === "ExpressionStatement" ||
                    node.type === "VariableDeclaration" ||
                    node.type === "ReturnStatement" ||
                    node.type === "ExportDefaultDeclaration" ||
                    node.type === "ExportNamedDeclaration" ||
                    node.type === "ClassProperty" ||
                    node.type === "PropertyDefinition"
                ) {
                    const todoLine = ` TODO(typeorm-v1): \`ConnectionManager\` was removed — ${MIGRATION_HINT}`
                    const nodeWithComments = node as Node & {
                        comments?: { value: string }[]
                    }
                    const alreadyFlagged = nodeWithComments.comments?.some(
                        (c) => c.value === todoLine,
                    )
                    if (!alreadyFlagged) {
                        addTodoComment(
                            node,
                            `\`ConnectionManager\` was removed — ${MIGRATION_HINT}`,
                            j,
                        )
                        hasChanges = true
                        hasTodos = true
                    }
                    break
                }
                current = current.parent
            }
        })

    // Remove `ConnectionManager` from imports. The class is gone, so
    // leaving the specifier would produce a TypeScript error that adds
    // noise on top of the TODO.
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

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = connectionManager
export default fn
