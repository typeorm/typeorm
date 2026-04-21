import path from "node:path"
import type {
    API,
    ASTPath,
    CallExpression,
    Collection,
    FileInfo,
    JSCodeshift,
    Node,
} from "jscodeshift"
import {
    getLocalNamesForImport,
    removeImportSpecifiers,
    removeReExportSpecifiers,
} from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "flag deprecated global functions for manual migration to `DataSource` methods"
export const manual = true

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

const todoHostTypes = new Set([
    "ExpressionStatement",
    "VariableDeclaration",
    "ReturnStatement",
])

const rewriteSimpleCall = (
    j: JSCodeshift,
    astPath: ASTPath<CallExpression>,
    replacement: string,
): boolean => {
    const parts = replacement.split(".")
    if (parts.length !== 2 || replacement.includes("(")) return false

    const [obj, member] = parts
    const memberExpr = j.memberExpression(
        j.identifier(obj),
        j.identifier(member),
    )
    const shouldUsePropertyAccess =
        astPath.node.arguments.length === 0 && !replacement.includes("get")
    j(astPath).replaceWith(
        shouldUsePropertyAccess
            ? memberExpr
            : j.callExpression(memberExpr, astPath.node.arguments),
    )
    return true
}

const annotateFirstDataSourceUsage = (
    root: Collection,
    j: JSCodeshift,
    hadNamedConnection: boolean,
): void => {
    const [firstUsage] = root.find(j.Identifier, { name: "dataSource" }).paths()
    if (!firstUsage) return

    let current = firstUsage
    while (current.parent) {
        const node: Node = current.parent.node
        if (todoHostTypes.has(node.type)) {
            const messages = [
                "`dataSource` is not defined — inject or import your DataSource instance",
            ]
            if (hadNamedConnection) {
                messages.push(
                    'named connections were removed in v1 — if you relied on `getConnection("name")`, wire up a second DataSource and reference it here',
                )
            }
            for (const message of messages) addTodoComment(node, message, j)
            return
        }
        current = current.parent
    }
}

export const globalFunctions = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

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

    let hasNamedConnection = false

    if (callReplacements.size > 0 || getConnectionLocals.size > 0) {
        root.find(j.CallExpression).forEach((astPath) => {
            const callee = astPath.node.callee
            if (callee.type !== "Identifier") return

            // `getConnection()` → `dataSource`. Named connections are gone
            // in v1 — rewrite `getConnection("name")` to `dataSource` too
            // (the argument is dropped) and flag so the user knows to
            // reconfigure for multi-DataSource setups.
            if (getConnectionLocals.has(callee.name)) {
                const hadArg = astPath.node.arguments.length > 0
                j(astPath).replaceWith(j.identifier("dataSource"))
                hasChanges = true
                if (hadArg) hasNamedConnection = true
                return
            }

            const replacement = callReplacements.get(callee.name)
            if (replacement && rewriteSimpleCall(j, astPath, replacement)) {
                hasChanges = true
            }
        })
    }

    if (removeImportSpecifiers(root, j, "typeorm", removedGlobals)) {
        hasChanges = true
    }

    // Remove re-exports of deprecated globals (barrel-file pattern)
    if (removeReExportSpecifiers(root, j, "typeorm", removedGlobals)) {
        hasChanges = true
    }

    if (hasChanges) {
        annotateFirstDataSourceUsage(root, j, hasNamedConnection)
        stats.count.todo(api, name, file)
    }

    return hasChanges ? root.toSource() : undefined
}

export const fn = globalFunctions
export default fn
