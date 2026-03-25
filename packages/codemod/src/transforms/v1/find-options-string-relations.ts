import type { API, FileInfo, ObjectExpression } from "jscodeshift"
import { getStringValue } from "../ast-helpers"

export const description = "replace string-array `relations` with object syntax"

interface NestedObject {
    [key: string]: true | NestedObject
}

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
                if (current[part] === undefined) {
                    current[part] = true
                }
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

export const findOptionsStringRelations = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // Find object properties named "relations" whose value is an array of strings
    root.find(j.ObjectProperty, {
        key: { name: "relations" },
    }).forEach((path) => {
        const value = path.node.value
        if (value.type !== "ArrayExpression") return

        const strings = value.elements.map((el) => el && getStringValue(el))
        if (strings.some((s) => s === null || s === undefined)) return

        const result = convertRelationsArrayToObject(strings as string[])
        path.node.value = buildObjectExpression(j, result)
        hasChanges = true
    })

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

export default findOptionsStringRelations
