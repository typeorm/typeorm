import path from "node:path"
import type { API, FileInfo, Node, VariableDeclarator } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "rename `ConnectionOptionsReader.all()` to `get()` and flag constructor usage for path semantics change"
export const manual = true

export const connectionOptionsReader = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    // Only operate on files that import ConnectionOptionsReader from typeorm
    if (!fileImportsFrom(root, j, "typeorm")) {
        return undefined
    }

    const importsReader =
        root
            .find(j.ImportDeclaration, {
                source: { value: "typeorm" },
            })
            .filter((p) =>
                (p.node.specifiers ?? []).some(
                    (s) =>
                        s.type === "ImportSpecifier" &&
                        s.imported.type === "Identifier" &&
                        s.imported.name === "ConnectionOptionsReader",
                ),
            )
            .size() > 0

    if (!importsReader) return undefined

    // Track identifiers bound to `new ConnectionOptionsReader()` so we can
    // rename `.all()` only on those bindings.
    const readerIdentifiers = new Set<string>()

    const constructorMessage =
        '`ConnectionOptionsReader` now searches `process.cwd()` instead of the app root — pass `{ root: "/custom/path" }` to override. `get(name)` and `has(name)` were also removed; use `get()` (previously `all()`) and filter the returned array.'

    root.find(j.NewExpression, {
        callee: { type: "Identifier", name: "ConnectionOptionsReader" },
    }).forEach((p) => {
        // Track the identifier for the renaming step below
        const parentPath = p.parent as { node?: Node } | undefined
        const parentNode = parentPath?.node
        if (parentNode?.type === "VariableDeclarator") {
            const decl = parentNode as VariableDeclarator
            if (decl.id.type === "Identifier") {
                readerIdentifiers.add(decl.id.name)
            }
        }

        // Walk up to find the enclosing statement for the TODO comment
        let current = p.parent
        while (current) {
            const node: Node = current.node
            if (
                node.type === "VariableDeclaration" ||
                node.type === "ExpressionStatement" ||
                node.type === "ReturnStatement"
            ) {
                addTodoComment(node, constructorMessage, j)
                hasChanges = true
                hasTodos = true
                break
            }
            current = current.parent
        }
    })

    // Rename `.all()` → `.get()` on tracked reader identifiers.
    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "all" },
        },
    }).forEach((p) => {
        const callee = p.node.callee
        if (callee.type !== "MemberExpression") return
        const obj = callee.object
        if (obj.type !== "Identifier") return
        if (!readerIdentifiers.has(obj.name)) return
        if (callee.property.type !== "Identifier") return

        callee.property.name = "get"
        hasChanges = true
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = connectionOptionsReader
export default fn
