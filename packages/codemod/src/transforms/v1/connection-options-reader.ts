import path from "node:path"
import type {
    API,
    ASTPath,
    CallExpression,
    FileInfo,
    Identifier,
    NewExpression,
    Node,
    OptionalCallExpression,
} from "jscodeshift"
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
// comment above the enclosing statement or declaration.
const isTodoHost = (type: string): boolean =>
    type.endsWith("Statement") ||
    type === "VariableDeclaration" ||
    type === "FunctionDeclaration" ||
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

    // Returns true when `node` is `require("typeorm")`.
    const isTypeormRequire = (node: Node | null | undefined): boolean => {
        if (node?.type !== "CallExpression") return false
        const call = node as CallExpression
        if (
            call.callee.type !== "Identifier" ||
            call.callee.name !== "require"
        ) {
            return false
        }
        const [arg] = call.arguments
        return !!arg && getStringValue(arg) === "typeorm"
    }

    // Local identifiers bound to `ConnectionOptionsReader` via an ESM
    // import or a CommonJS destructured require (handles aliases).
    const readerLocalNames = getLocalNamesForImport(
        root,
        j,
        "typeorm",
        "ConnectionOptionsReader",
    )

    // Namespace and member-require bindings — both anchor on a
    // `const <id> = require("typeorm")[ .X ]` VariableDeclarator shape so we
    // iterate once and classify by whether the init is the require call
    // itself (namespace) or a member access (`.ConnectionOptionsReader`).
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
    root.find(j.VariableDeclarator).forEach((p) => {
        const init = p.node.init
        if (!init || p.node.id.type !== "Identifier") return
        const localName = p.node.id.name
        if (isTypeormRequire(init)) {
            namespaceNames.add(localName)
        } else if (
            init.type === "MemberExpression" &&
            isTypeormRequire(init.object) &&
            init.property.type === "Identifier" &&
            init.property.name === "ConnectionOptionsReader"
        ) {
            readerLocalNames.add(localName)
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
    //   const r = new ConnectionOptionsReader()            // VariableDeclarator
    //   let r; r = new ConnectionOptionsReader()           // AssignmentExpression
    //   function f(r = new ConnectionOptionsReader()) {}   // AssignmentPattern (default-param)
    // We rename `.all()` only on these bindings so unrelated `.all()` calls
    // on other types stay untouched.
    const readerInstanceBindings = new Set<string>()
    const flaggedHosts = new WeakSet<Node>()

    root.find(j.NewExpression).forEach((astPath) => {
        if (!isReaderConstruction(astPath)) return

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
        } else if (
            parent.type === "AssignmentPattern" &&
            parent.left.type === "Identifier"
        ) {
            readerInstanceBindings.add(parent.left.name as string)
        }

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
    //   * on the optional-chain variants `r?.all()`, `r.all?.()`, `r?.all?.()`
    //
    // Only rename zero-argument calls: the v0 `all()` never took arguments, so
    // anything passing an arg is unrelated code that happens to share the name.
    const isReaderReceiver = (obj: Node): boolean => {
        if (obj.type === "Identifier") {
            return readerInstanceBindings.has((obj as Identifier).name)
        }
        if (obj.type === "NewExpression") {
            // jscodeshift hands us a NewExpression node here directly; synthesize
            // a minimal ASTPath wrapper so we can reuse `isReaderConstruction`.
            return isReaderConstruction({
                node: obj as NewExpression,
            } as ASTPath<NewExpression>)
        }
        return false
    }

    const tryRename = (node: CallExpression | OptionalCallExpression): void => {
        if (node.arguments.length !== 0) return
        const callee = node.callee
        if (
            callee.type !== "MemberExpression" &&
            callee.type !== "OptionalMemberExpression"
        ) {
            return
        }
        const member = callee
        if (
            member.property.type !== "Identifier" ||
            member.property.name !== "all"
        ) {
            return
        }
        if (!isReaderReceiver(member.object)) return
        member.property.name = "get"
        hasChanges = true
    }
    root.find(j.CallExpression).forEach((p) => tryRename(p.node))
    root.find(j.OptionalCallExpression).forEach((p) => tryRename(p.node))

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = connectionOptionsReader
export default fn
