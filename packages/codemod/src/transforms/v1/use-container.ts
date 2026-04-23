import path from "node:path"
import type { API, ASTPath, CallExpression, FileInfo, Node } from "jscodeshift"
import {
    fileImportsFrom,
    getLocalNamesForImport,
    removeImportSpecifiers,
    removeReExportSpecifiers,
} from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "remove `useContainer()` and `getFromContainer()` calls"
export const manual = true

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

export const useContainer = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    // `useContainer` is also exported by typedi/tsyringe, so gate the
    // transform to files that actually import from typeorm and avoid
    // rewriting unrelated DI container calls.
    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    const removedFunctions = ["useContainer", "getFromContainer"] as const

    // Resolve alias-aware local names per function, so
    //   `import { useContainer as uc } from "typeorm"; uc(...)` still flags.
    const localNamesByFunction = new Map<string, string>()
    for (const funcName of removedFunctions) {
        for (const localName of getLocalNamesForImport(
            root,
            j,
            "typeorm",
            funcName,
        )) {
            localNamesByFunction.set(localName, funcName)
        }
    }

    if (localNamesByFunction.size > 0) {
        root.find(j.CallExpression).forEach(
            (callPath: ASTPath<CallExpression>) => {
                const callee = callPath.node.callee
                if (callee.type !== "Identifier") return
                const funcName = localNamesByFunction.get(callee.name)
                if (!funcName) return

                const message = `${funcName}() was removed — the container system is no longer supported`

                // Bare `useContainer(...)` at statement level → replace with
                // an empty statement carrying the migration comment.
                const parent = callPath.parent.node
                if (parent.type === "ExpressionStatement") {
                    const replacement = j.emptyStatement()
                    if (!hasTodoComment(replacement, message)) {
                        addTodoComment(replacement, message, j)
                    }
                    ;(
                        callPath.parent as unknown as {
                            replace: (node: Node) => void
                        }
                    ).replace(replacement)
                    hasChanges = true
                    hasTodos = true
                    return
                }

                // Non-statement usage (assignment, return, argument, etc.):
                // leave the call in place but attach a comment to the enclosing
                // statement so the user can't miss the manual migration.
                let current: ASTPath<Node> | null = callPath
                while (current) {
                    const node: Node = current.node
                    if (todoHostTypes.has(node.type)) {
                        if (!hasTodoComment(node, message)) {
                            addTodoComment(node, message, j)
                        }
                        hasChanges = true
                        hasTodos = true
                        break
                    }
                    current = current.parent
                }
            },
        )
    }

    const removedImports = new Set([
        "useContainer",
        "getFromContainer",
        "ContainerInterface",
        "ContainedType",
        "UseContainerOptions",
    ])

    if (removeImportSpecifiers(root, j, "typeorm", removedImports)) {
        hasChanges = true
    }

    if (removeReExportSpecifiers(root, j, "typeorm", removedImports)) {
        hasChanges = true
    }

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = useContainer
export default fn
