import path from "node:path"
import type { API, FileInfo, Node } from "jscodeshift"
import { removeImportSpecifiers } from "../ast-helpers"
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

    // Replace function calls
    for (const [funcName, replacement] of Object.entries(simpleReplacements)) {
        root.find(j.CallExpression, {
            callee: { type: "Identifier", name: funcName },
        }).forEach((path) => {
            const parts = replacement.split(".")
            if (parts.length === 2 && !replacement.includes("(")) {
                // Property access like dataSource.manager — check if it's called with no args
                if (
                    path.node.arguments.length === 0 &&
                    !replacement.includes("get")
                ) {
                    // Replace with property access
                    j(path).replaceWith(
                        j.memberExpression(
                            j.identifier(parts[0]),
                            j.identifier(parts[1]),
                        ),
                    )
                } else {
                    // Replace with method call
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
            }
        })
    }

    // getConnection() → dataSource (just a reference)
    root.find(j.CallExpression, {
        callee: { type: "Identifier", name: "getConnection" },
    }).forEach((path) => {
        if (path.node.arguments.length === 0) {
            j(path).replaceWith(j.identifier("dataSource"))
            hasChanges = true
        }
    })

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
