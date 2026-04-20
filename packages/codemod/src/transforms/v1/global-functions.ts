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
import { addTodoComment, hasTodoComment } from "../todo"
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

// Removed globals that have NO automatic rewrite — each call site gets a
// comment explaining the manual migration path. Without this, the import
// is stripped but the call remains, producing a ReferenceError at runtime
// with no trace in the codemod output.
const manualRemovedGlobals: Record<string, string> = {
    createConnection:
        "`createConnection()` was removed — instantiate a `DataSource` and call `.initialize()` instead: `const dataSource = new DataSource(options); await dataSource.initialize()`",
    createConnections:
        "`createConnections()` was removed — instantiate one `DataSource` per configuration and call `.initialize()` on each; multi-connection setups must be managed explicitly",
    getConnectionManager:
        "`getConnectionManager()` was removed — the global `ConnectionManager` singleton no longer exists; hold and share `DataSource` instances directly",
    getConnectionOptions:
        "`getConnectionOptions()` was removed — load your ormconfig manually and pass the object into `new DataSource(options)`",
    getSqljsManager:
        "`getSqljsManager()` was removed — access the sql.js-specific API via `(dataSource.driver as SqljsDriver)` on your initialized DataSource",
}

// Simple replacements: `getX()` rewrites to either a property access
// (`getManager()` → `dataSource.manager`) or a method call
// (`getRepository(User)` → `dataSource.getRepository(User)`); see
// `rewriteSimpleCall` for the heuristic that picks the right shape.
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
    // Class field initializer — `conn = createConnection()` inside a class
    // body has no enclosing Statement/VariableDeclaration, so the walk
    // must recognise the property itself as a host.
    "ClassProperty",
    "PropertyDefinition",
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

    // Build lookup: local-name → manual-removal comment message, so aliased
    // imports like `import { createConnection as cc } from "typeorm"` still
    // get their call sites flagged.
    const manualTodos = new Map<string, string>()
    for (const [funcName, message] of Object.entries(manualRemovedGlobals)) {
        for (const localName of getLocalNamesForImport(
            root,
            j,
            "typeorm",
            funcName,
        )) {
            manualTodos.set(localName, message)
        }
    }

    // Rewrites `getConnection()` → `dataSource`, stripping the argument.
    // Sets `hasNamedConnection` when the call had a named-connection arg.
    const rewriteGetConnection = (
        astPath: ASTPath<CallExpression>,
    ): boolean => {
        const hadArg = astPath.node.arguments.length > 0
        j(astPath).replaceWith(j.identifier("dataSource"))
        if (hadArg) hasNamedConnection = true
        return true
    }

    // Attaches a manual-migration comment to the enclosing statement of
    // `astPath`. Returns whether anything changed.
    const attachManualTodo = (
        astPath: ASTPath<CallExpression>,
        manualMessage: string,
    ): boolean => {
        let current: ASTPath<Node> | null = astPath as unknown as ASTPath<Node>
        while (current) {
            const node: Node = current.node
            if (todoHostTypes.has(node.type)) {
                if (!hasTodoComment(node, manualMessage)) {
                    addTodoComment(node, manualMessage, j)
                }
                return true
            }
            current = current.parent
        }
        return false
    }

    const handleCallSite = (astPath: ASTPath<CallExpression>): void => {
        const callee = astPath.node.callee
        if (callee.type !== "Identifier") return

        if (getConnectionLocals.has(callee.name)) {
            if (rewriteGetConnection(astPath)) hasChanges = true
            return
        }

        const replacement = callReplacements.get(callee.name)
        if (replacement && rewriteSimpleCall(j, astPath, replacement)) {
            hasChanges = true
            return
        }

        const manualMessage = manualTodos.get(callee.name)
        if (manualMessage && attachManualTodo(astPath, manualMessage)) {
            hasChanges = true
        }
    }

    if (
        callReplacements.size > 0 ||
        getConnectionLocals.size > 0 ||
        manualTodos.size > 0
    ) {
        root.find(j.CallExpression).forEach(handleCallSite)
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
