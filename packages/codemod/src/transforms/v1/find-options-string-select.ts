import path from "node:path"
import type { API, ASTNode, FileInfo } from "jscodeshift"
import {
    getStringValue,
    isFindMethodCallArgument,
    isObjectFromEntriesCall,
} from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "replace string-array `select` with object syntax"

// Builds `Object.fromEntries(<expr>.map(f => [f, true]))` — an in-place wrap
// that converts a `string[]` value to the v1 `{ [field]: true }` object at
// runtime. Safe for `select` because v0 only accepted `string[]`; any other
// shape would already have been broken pre-migration.
const wrapDynamicStringArray = (
    j: API["jscodeshift"],
    expr: ASTNode,
): ASTNode => {
    type E = Parameters<typeof j.callExpression>[0]
    return j.callExpression(
        j.memberExpression(j.identifier("Object"), j.identifier("fromEntries")),
        [
            j.callExpression(
                j.memberExpression(expr as E, j.identifier("map")),
                [
                    j.arrowFunctionExpression(
                        [j.identifier("f")],
                        j.arrayExpression([j.identifier("f"), j.literal(true)]),
                    ),
                ],
            ) as E,
        ],
    )
}

export const findOptionsStringSelect = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    let hasChanges = false

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

        // Dynamic value (CallExpression, Identifier, ConditionalExpression,
        // etc.) — we can't statically enumerate the fields, but v0's `select`
        // only accepted `string[]`, so wrapping the expression with
        // `Object.fromEntries(...map(f => [f, true]))` is a correct and safe
        // transform: runtime-equivalent to the manual conversion the user
        // would otherwise write.
        propPath.node.value = wrapDynamicStringArray(
            j,
            value as ASTNode,
        ) as typeof value
        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = findOptionsStringSelect
export default fn
