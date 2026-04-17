import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { getLocalNamesForImport, removeImportSpecifiers } from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag deprecated global functions for manual migration to `DataSource` methods"
export const manual = true

export const globalFunctions = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    const removedGlobals = new Set([
        "createConnection",
        "createConnections",
        "getConnection",
        "getConnectionManager",
        "getConnectionOptions",
        "getManager",
        "getSqljsManager",
        "getRepository",
        "getTreeRepository",
        "createQueryBuilder",
        "getMongoManager",
        "getMongoRepository",
    ])

    // Simple replacements: getX(args) → dataSource.x(args)
    const simpleReplacements: Record<string, string> = {
        getManager: "dataSource.manager",
        getRepository: "dataSource.getRepository",
        getTreeRepository: "dataSource.getTreeRepository",
        createQueryBuilder: "dataSource.createQueryBuilder",
        getMongoManager: "dataSource.mongoManager",
        getMongoRepository: "dataSource.getMongoRepository",
    }

    // Resolve the local names (including aliases such as
    // `import { getManager as gm } from "typeorm"`) for every function we
    // know how to rewrite, then replace all matching call-sites in a single
    // pass over `CallExpression` nodes.
    const callReplacements = new Map<string, string>()
    for (const [funcName, replacement] of Object.entries(simpleReplacements)) {
        for (const localName of getLocalNamesForImport(
            root,
            j,
            "typeorm",
            funcName,
        )) {
            callReplacements.set(localName, replacement)
        }
    }
    const getConnectionLocals = getLocalNamesForImport(
        root,
        j,
        "typeorm",
        "getConnection",
    )

    if (callReplacements.size > 0 || getConnectionLocals.size > 0) {
        root.find(j.CallExpression).forEach((path) => {
            const callee = path.node.callee
            if (callee.type !== "Identifier") return

            // getConnection() → dataSource (just a reference)
            if (
                getConnectionLocals.has(callee.name) &&
                path.node.arguments.length === 0
            ) {
                j(path).replaceWith(j.identifier("dataSource"))
                hasChanges = true
                return
            }

            const replacement = callReplacements.get(callee.name)
            if (!replacement) return

            const parts = replacement.split(".")
            if (parts.length !== 2 || replacement.includes("(")) return

            if (
                path.node.arguments.length === 0 &&
                !replacement.includes("get")
            ) {
                // Property access like `dataSource.manager`
                j(path).replaceWith(
                    j.memberExpression(
                        j.identifier(parts[0]),
                        j.identifier(parts[1]),
                    ),
                )
            } else {
                // Method call like `dataSource.getRepository(User)`
                j(path).replaceWith(
                    j.callExpression(
                        j.memberExpression(
                            j.identifier(parts[0]),
                            j.identifier(parts[1]),
                        ),
                        path.node.arguments,
                    ),
                )
            }
            hasChanges = true
        })
    }

    // Remove imports of deprecated globals from "typeorm"
    if (removeImportSpecifiers(root, j, "typeorm", removedGlobals)) {
        hasChanges = true
    }

    // Add a TODO comment on the first dataSource usage
    if (hasChanges) {
        const firstUsage = root.find(j.Identifier, { name: "dataSource" })
        if (firstUsage.length > 0) {
            let current = firstUsage.paths()[0]
            while (current.parent) {
                const node: Node = current.parent.node
                if (
                    node.type === "ExpressionStatement" ||
                    node.type === "VariableDeclaration" ||
                    node.type === "ReturnStatement"
                ) {
                    addTodoComment(
                        node,
                        "`dataSource` is not defined — inject or import your DataSource instance",
                        j,
                    )
                    break
                }
                current = current.parent
            }
        }
        stats.count.todo(api, name, file)
    }

    return hasChanges ? root.toSource() : undefined
}

export const fn = globalFunctions
export default fn
