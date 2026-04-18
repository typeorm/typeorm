import path from "node:path"
import type { API, ASTPath, FileInfo, NewExpression, Node } from "jscodeshift"
import {
    fileImportsFrom,
    getLocalNamesForImport,
    getStringValue,
} from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "rename `ConnectionOptionsReader.all()` to `get()` and flag constructor usage for path semantics change"
export const manual = true

const CONSTRUCTOR_MESSAGE =
    '`ConnectionOptionsReader` now searches `process.cwd()` instead of the app root — pass `{ root: "/custom/path" }` to override. `get(name)` and `has(name)` were also removed; use `get()` (previously `all()`) and filter the returned array.'

// Statement-like ancestors that survive jscodeshift/recast's printing when
// used as a comment host. Walking up to one of these produces a visible
// TODO above the enclosing statement or declaration.
const isTodoHost = (type: string): boolean =>
    type.endsWith("Statement") ||
    type === "VariableDeclaration" ||
    type === "ExportDefaultDeclaration" ||
    type === "ExportNamedDeclaration" ||
    type === "ClassProperty" ||
    type === "PropertyDefinition"

export const connectionOptionsReader = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    // Quick scope guard — skip files that never touch typeorm.
    if (!fileImportsFrom(root, j, "typeorm")) {
        return undefined
    }

    // Local identifiers bound to `ConnectionOptionsReader` via an ESM
    // import or a CommonJS destructured require (handles aliases).
    const readerLocalNames = getLocalNamesForImport(
        root,
        j,
        "typeorm",
        "ConnectionOptionsReader",
    )

    // Namespace bindings: `import * as typeorm from "typeorm"` or
    // `const typeorm = require("typeorm")`. Used to recognize
    // `new typeorm.ConnectionOptionsReader()` constructions.
    const namespaceNames = new Set<string>()
    root.find(j.ImportDeclaration, {
        source: { value: "typeorm" },
    }).forEach((p) => {
        for (const s of p.node.specifiers ?? []) {
            if (
                s.type === "ImportNamespaceSpecifier" &&
                s.local?.type === "Identifier"
            ) {
                namespaceNames.add(s.local.name)
            }
        }
    })
    root.find(j.VariableDeclarator, {
        init: {
            type: "CallExpression",
            callee: { type: "Identifier", name: "require" },
        },
    }).forEach((p) => {
        const init = p.node.init
        if (!init || init.type !== "CallExpression") return
        const [arg] = init.arguments
        if (!arg || getStringValue(arg) !== "typeorm") return
        if (p.node.id.type === "Identifier") {
            namespaceNames.add(p.node.id.name)
        }
    })

    if (readerLocalNames.size === 0 && namespaceNames.size === 0) {
        return undefined
    }

    // Returns true when `callee` is one of the recognized constructor forms:
    // a bare identifier from `readerLocalNames` or `namespace.ConnectionOptionsReader`.
    const isReaderConstruction = (astPath: ASTPath<NewExpression>): boolean => {
        const callee = astPath.node.callee
        if (callee.type === "Identifier") {
            return readerLocalNames.has(callee.name)
        }
        if (
            callee.type === "MemberExpression" &&
            callee.object.type === "Identifier" &&
            namespaceNames.has(callee.object.name) &&
            callee.property.type === "Identifier" &&
            callee.property.name === "ConnectionOptionsReader"
        ) {
            return true
        }
        return false
    }

    // Identifiers that are assigned a reader instance via
    //   const r = new ConnectionOptionsReader()
    //   let r; r = new ConnectionOptionsReader()
    // We rename `.all()` only on these bindings so unrelated `.all()` calls
    // on other types stay untouched.
    const readerInstanceBindings = new Set<string>()
    const flaggedHosts = new WeakSet<Node>()

    root.find(j.NewExpression).forEach((astPath) => {
        if (!isReaderConstruction(astPath)) return

        // Track instance bindings from both declaration and assignment forms
        const parent = astPath.parent.node
        if (
            parent.type === "VariableDeclarator" &&
            parent.id.type === "Identifier"
        ) {
            readerInstanceBindings.add(parent.id.name as string)
        } else if (
            parent.type === "AssignmentExpression" &&
            parent.left.type === "Identifier"
        ) {
            readerInstanceBindings.add(parent.left.name as string)
        }

        // Walk up to the enclosing statement for the TODO comment, skipping
        // hosts we have already flagged in this run (dedup) and any host
        // that already carries the same TODO (idempotent on re-runs).
        let current = astPath.parent
        while (current) {
            const node: Node = current.node
            if (isTodoHost(node.type)) {
                if (
                    !flaggedHosts.has(node) &&
                    !hasTodoComment(node, CONSTRUCTOR_MESSAGE)
                ) {
                    addTodoComment(node, CONSTRUCTOR_MESSAGE, j)
                    flaggedHosts.add(node)
                    hasChanges = true
                    hasTodos = true
                }
                break
            }
            current = current.parent
        }
    })

    // Rename `.all()` → `.get()`:
    //   * on tracked reader-instance bindings (`r.all()` where `r = new ...`)
    //   * on inline constructor receivers (`new X().all()` — safe because
    //     the receiver type is statically known)
    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "all" },
        },
    }).forEach((p) => {
        const callee = p.node.callee
        if (callee.type !== "MemberExpression") return
        if (callee.property.type !== "Identifier") return

        const obj = callee.object
        const isReaderReceiver =
            (obj.type === "Identifier" &&
                readerInstanceBindings.has(obj.name)) ||
            (obj.type === "NewExpression" &&
                // Need the typed path for `isReaderConstruction`; jscodeshift
                // hands us a NewExpression node here directly, so synthesize
                // a minimal ASTPath wrapper.
                isReaderConstruction({
                    node: obj,
                } as ASTPath<NewExpression>))
        if (!isReaderReceiver) return

        callee.property.name = "get"
        hasChanges = true
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = connectionOptionsReader
export default fn
