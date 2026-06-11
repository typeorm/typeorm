import path from "node:path"
import type {
    API,
    ASTNode,
    FileInfo,
    Node,
    ObjectExpression,
} from "jscodeshift"
import {
    getStringValue,
    isFindMethodCallArgument,
    isObjectFromEntriesCall,
} from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "replace string-array `relations` with object syntax"
export const manual = true

interface NestedObject {
    [key: string]: true | NestedObject
}

// `relations` differs from `select` in one important way: v0 supported
// dot-paths (`"posts.comments"`) that must become nested objects in v1
// (`{ posts: { comments: true } }`). For a dynamic expression we can't
// tell at transform time whether the values contain dots, so we wrap with
// `Object.fromEntries(...map(r => [r, true]))` AND attach a comment
// noting that dot-paths need manual nesting.
const DYNAMIC_RELATIONS_DOT_PATH_NOTE =
    '`relations` now takes an object. If the dynamic list contains dot-paths like `"posts.comments"`, the wrap below produces `{ "posts.comments": true }` — convert those to nested objects manually: `{ posts: { comments: true } }`.'

// Bound variables / member-access values may already hold v1 object form
// instead of `string[]`, so wrapping would crash at runtime. Leave a
// comment with the conversion snippets so the user picks the right option.
const BOUND_RELATIONS_MESSAGE =
    "`relations` no longer accepts a string array. This value references a variable whose shape can't be determined statically — if it holds `string[]`, wrap it: `Object.fromEntries(<expr>?.map(r => [r, true]) ?? [])` (dot-paths need extra nesting handling). If it already holds the v1 object shape, no change needed."

/**
 * Convert an array of dot-path strings into a nested object structure.
 *
 * Example: `["profile", "posts.comments"]` becomes
 * `{ profile: true, posts: { comments: true } }`
 */
function convertRelationsArrayToObject(values: string[]): NestedObject {
    const result: NestedObject = {}

    for (const val of values) {
        const parts = val.split(".")
        let current: NestedObject = result
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            if (i === parts.length - 1) {
                current[part] ??= true
            } else {
                if (current[part] === undefined || current[part] === true) {
                    current[part] = {}
                }
                current = current[part]
            }
        }
    }

    return result
}

// Builds `Object.fromEntries(<expr>?.map(r => [r, true]) ?? [])` — the
// optional-chain + nullish fallback keeps the migrated code runnable when
// the dynamic expression evaluates to `undefined`/`null` (e.g.
// `relations: flag ? ["posts"] : undefined`). v0 would have skipped the
// property in that case; the wrap here emits an empty object, matching.
const wrapDynamicStringArray = (
    j: API["jscodeshift"],
    expr: ASTNode,
): ASTNode => {
    type E = Parameters<typeof j.callExpression>[0]
    const optionalMapCall = j.callExpression(
        j.optionalMemberExpression(expr as E, j.identifier("map")),
        [
            j.arrowFunctionExpression(
                [j.identifier("r")],
                j.arrayExpression([j.identifier("r"), j.literal(true)]),
            ),
        ],
    )
    return j.callExpression(
        j.memberExpression(j.identifier("Object"), j.identifier("fromEntries")),
        [j.logicalExpression("??", optionalMapCall, j.arrayExpression([]))],
    )
}

export const findOptionsStringRelations = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    let hasChanges = false
    let hasTodos = false

    root.find(j.ObjectProperty, {
        key: { name: "relations" },
    }).forEach((propPath) => {
        if (!isFindMethodCallArgument(propPath)) return

        const value = propPath.node.value
        if (value.type === "ArrayExpression") {
            const strings = value.elements.map((el) => el && getStringValue(el))
            if (strings.some((s) => s === null || s === undefined)) return

            const result = convertRelationsArrayToObject(strings as string[])
            propPath.node.value = buildObjectExpression(j, result)
            hasChanges = true
            return
        }

        // Already in v1 object form — nothing to do.
        if (value.type === "ObjectExpression") return

        // Already wrapped by a previous pass — don't double-wrap, and don't
        // re-add the dot-path comment (`hasTodoComment` would dedupe it anyway).
        if (isObjectFromEntriesCall(value)) return

        const walkToStatement = (message: string): void => {
            let current = propPath.parent as {
                node: Node
                parent: unknown
            } | null
            while (current) {
                const t = current.node.type
                if (t.endsWith("Statement") || t === "VariableDeclaration") {
                    if (!hasTodoComment(current.node, message)) {
                        addTodoComment(current.node, message, j)
                        hasTodos = true
                    }
                    return
                }
                current = current.parent as {
                    node: Node
                    parent: unknown
                } | null
            }
        }

        // Bound variable / member access — value might already be in v1
        // object shape. Leave a comment instead of wrapping.
        if (
            value.type === "Identifier" ||
            value.type === "MemberExpression" ||
            value.type === "OptionalMemberExpression"
        ) {
            walkToStatement(BOUND_RELATIONS_MESSAGE)
            hasChanges = true
            return
        }

        // Inline dynamic value (CallExpression, ConditionalExpression, etc.)
        // — wrap with `Object.fromEntries(...)`. Attach the dot-path comment
        // because nesting can't be detected statically.
        propPath.node.value = wrapDynamicStringArray(j, value) as typeof value
        hasChanges = true
        walkToStatement(DYNAMIC_RELATIONS_DOT_PATH_NOTE)
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

function buildObjectExpression(
    j: API["jscodeshift"],
    obj: NestedObject,
): ObjectExpression {
    const properties = Object.entries(obj).map(([key, value]) => {
        if (value === true) {
            return j.property("init", j.identifier(key), j.literal(true))
        }
        return j.property(
            "init",
            j.identifier(key),
            buildObjectExpression(j, value),
        )
    })
    return j.objectExpression(properties)
}

export const fn = findOptionsStringRelations
export default fn
