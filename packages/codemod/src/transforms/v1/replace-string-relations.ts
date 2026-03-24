import type { API, FileInfo } from "jscodeshift"

export const description = "replace string-array `relations` with object syntax"

export const replaceStringRelations = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // Find object properties named "relations" whose value is an array of strings
    root.find(j.ObjectProperty, {
        key: { name: "relations" },
    }).forEach((path) => {
        const value = path.node.value
        if (value.type !== "ArrayExpression") return

        // Check all elements are string literals
        const elements = value.elements
        if (
            !elements.every(
                (el) =>
                    el !== null &&
                    (el.type === "StringLiteral" || el.type === "Literal") &&
                    typeof (el as any).value === "string",
            )
        ) {
            return
        }

        // Convert ["profile", "posts.comments"] →
        // { profile: true, posts: { comments: true } }
        const result: Record<string, any> = {}
        for (const el of elements as any[]) {
            const parts = (el.value as string).split(".")
            let current = result
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

        path.node.value = buildObjectExpression(j, result)
        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

function buildObjectExpression(j: any, obj: Record<string, any>): any {
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

export default replaceStringRelations
