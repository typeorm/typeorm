import path from "node:path"
import type { API, ASTNode, FileInfo, Node } from "jscodeshift"
import {
    getStringValue,
    isFindMethodCallArgument,
    isObjectFromEntriesCall,
} from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "replace string-array `select` with object syntax"
export const manual = true

// Bound variables / member-access values may already hold v1 object form
// (`{ id: true }`) instead of `string[]` — wrapping them with
// `Object.fromEntries(...)` would crash at runtime. Leave a comment so the
// user can convert manually based on the actual runtime type.
const BOUND_SELECT_MESSAGE =
    "`select` no longer accepts a string array. This value references a variable whose shape can't be determined statically — if it holds `string[]`, wrap it: `Object.fromEntries(<expr>?.map(f => [f, true]) ?? [])`. If it already holds the v1 object shape `{ field: true }`, no change needed."

// Builds `Object.fromEntries(<expr>?.map(f => [f, true]) ?? [])` — wraps
// a `string[]`-returning expression into the v1 `{ [field]: true }` object
// at runtime. The optional-chain + nullish fallback preserves v0 semantics
// for patterns like `select: flag ? ["id"] : undefined`, where the original
// code would simply skip `select` and the post-migration code must do the
// same (empty object = no explicit selection = all columns).
const wrapDynamicStringArray = (
    j: API["jscodeshift"],
    expr: ASTNode,
): ASTNode => {
    type E = Parameters<typeof j.callExpression>[0]
    const optionalMapCall = j.callExpression(
        j.optionalMemberExpression(expr as E, j.identifier("map")),
        [
            j.arrowFunctionExpression(
                [j.identifier("f")],
                j.arrayExpression([j.identifier("f"), j.literal(true)]),
            ),
        ],
    )
    return j.callExpression(
        j.memberExpression(j.identifier("Object"), j.identifier("fromEntries")),
        [j.logicalExpression("??", optionalMapCall, j.arrayExpression([]))],
    )
}

// Walks up to the enclosing Statement / VariableDeclaration and attaches
// the bound-variable comment there (recast drops comments placed on
// inner expressions). Returns true when a new comment was added.
const attachBoundTodo = (
    propPath: { parent: unknown },
    j: API["jscodeshift"],
): boolean => {
    let current = propPath.parent as {
        node: Node
        parent: unknown
    } | null
    while (current) {
        const t = current.node.type
        if (t.endsWith("Statement") || t === "VariableDeclaration") {
            if (hasTodoComment(current.node, BOUND_SELECT_MESSAGE)) return false
            addTodoComment(current.node, BOUND_SELECT_MESSAGE, j)
            return true
        }
        current = current.parent as {
            node: Node
            parent: unknown
        } | null
    }
    return false
}

export const findOptionsStringSelect = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    let hasChanges = false
    let hasTodos = false

    root.find(j.ObjectProperty, {
        key: { name: "select" },
    }).forEach((propPath) => {
        // Gate on call-site shape, not file-level typeorm import, so we still
        // fire in NestJS-style service files that only pull TypeORM types via
        // a wrapper module.
        if (!isFindMethodCallArgument(propPath)) return

        const value = propPath.node.value
        if (value.type === "ArrayExpression") {
            const strings = value.elements.map((el) => el && getStringValue(el))
            if (strings.some((s) => s === null || s === undefined)) return

            propPath.node.value = j.objectExpression(
                (strings as string[]).map((s) =>
                    j.property("init", j.identifier(s), j.literal(true)),
                ),
            )
            hasChanges = true
            return
        }

        // Already in v1 object form — nothing to do.
        if (value.type === "ObjectExpression") return

        // Already wrapped by a previous pass — don't double-wrap.
        if (isObjectFromEntriesCall(value)) return

        // Bound variable / member access — the value might already be in v1
        // object shape (a partially-migrated codebase), so wrapping would
        // crash at runtime. Leave a comment instead.
        if (
            value.type === "Identifier" ||
            value.type === "MemberExpression" ||
            value.type === "OptionalMemberExpression"
        ) {
            if (attachBoundTodo(propPath, j)) hasTodos = true
            hasChanges = true
            return
        }

        // Inline dynamic value (CallExpression, ConditionalExpression, etc.)
        // — wrap unconditionally; v0 only accepted `string[]` so the runtime
        // shape is known to be the array form.
        propPath.node.value = wrapDynamicStringArray(
            j,
            value as ASTNode,
        ) as typeof value
        hasChanges = true
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = findOptionsStringSelect
export default fn
