import path from "node:path"
import type {
    API,
    ASTPath,
    CallExpression,
    FileInfo,
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
    // Tracked as (scope, name) pairs so a shadowed `r` in a nested scope can
    // hold an unrelated value without its `.all()` calls being renamed.
    interface ScopeLike {
        lookup(name: string): ScopeLike | null
    }
    interface ScopedPath {
        scope: ScopeLike
    }
    const readerBindings = new Map<ScopeLike, Set<string>>()
    const flaggedHosts = new WeakSet<Node>()

    // Key bindings under the declaring scope (the one `scope.lookup` returns
    // for usages). For `let r; r = new X()` the assignment lives in a nested
    // scope but `r` is declared outside — recording under the assignment-site
    // scope would miss later `r.all()` lookups.
    const recordBinding = (siteScope: ScopeLike, name: string): void => {
        const declaringScope = siteScope.lookup(name) ?? siteScope
        let bucket = readerBindings.get(declaringScope)
        if (!bucket) {
            bucket = new Set()
            readerBindings.set(declaringScope, bucket)
        }
        bucket.add(name)
    }

    root.find(j.NewExpression).forEach((astPath) => {
        if (!isReaderConstruction(astPath)) return

        const parent = astPath.parent.node
        const parentScope = (astPath.parent as unknown as ScopedPath).scope
        if (
            parent.type === "VariableDeclarator" &&
            parent.id.type === "Identifier"
        ) {
            recordBinding(parentScope, parent.id.name as string)
        } else if (
            parent.type === "AssignmentExpression" &&
            parent.left.type === "Identifier"
        ) {
            recordBinding(parentScope, parent.left.name as string)
        } else if (
            parent.type === "AssignmentPattern" &&
            parent.left.type === "Identifier"
        ) {
            recordBinding(parentScope, parent.left.name as string)
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

    // Resolves an identifier receiver's scope-declared binding and returns
    // true if it was recorded as a reader instance. Returning false for
    // shadowed/reassigned names keeps unrelated `.all()` calls untouched.
    const isTrackedIdentifier = (
        name: string,
        useScope: ScopeLike | undefined,
    ): boolean => {
        if (!useScope) return false
        const declaringScope = useScope.lookup(name)
        if (!declaringScope) return false
        return readerBindings.get(declaringScope)?.has(name) ?? false
    }

    // Rename `.all()` → `.get()`:
    //   * on tracked reader-instance bindings (`r.all()` where `r = new ...`)
    //   * on inline constructor receivers (`new X().all()` — safe because
    //     the receiver type is statically known)
    //   * on the optional-chain variants `r?.all()`, `r.all?.()`, `r?.all?.()`
    //
    // Only rename zero-argument calls: the v0 `all()` never took arguments, so
    // anything passing an arg is unrelated code that happens to share the name.
    const tryRename = (
        callPath: ASTPath<CallExpression | OptionalCallExpression>,
    ): void => {
        const node = callPath.node
        if (node.arguments.length !== 0) return
        const callee = node.callee
        if (
            callee.type !== "MemberExpression" &&
            callee.type !== "OptionalMemberExpression"
        ) {
            return
        }
        const member = callee
        const propertyName =
            member.property.type === "Identifier"
                ? member.property.name
                : member.computed
                  ? getStringValue(member.property)
                  : undefined
        if (propertyName !== "all") return
        const receiver = member.object
        let matches = false
        if (receiver.type === "Identifier") {
            matches = isTrackedIdentifier(
                receiver.name,
                (callPath as unknown as ScopedPath).scope,
            )
        } else if (receiver.type === "NewExpression") {
            matches = isReaderConstruction({
                node: receiver,
            } as ASTPath<NewExpression>)
        }
        if (!matches) return
        if (member.property.type === "Identifier") {
            member.property.name = "get"
        } else {
            // Computed string key — replace the property with a fresh identifier
            // so the output reads `r.get()` instead of `r["get"]()`.
            member.property = j.identifier("get")
            member.computed = false
        }
        hasChanges = true
    }
    root.find(j.CallExpression).forEach(tryRename)
    root.find(j.OptionalCallExpression).forEach(tryRename)

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = connectionOptionsReader
export default fn
