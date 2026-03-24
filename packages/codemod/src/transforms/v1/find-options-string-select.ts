import type { ASTNode, API, FileInfo } from "jscodeshift"

export const description = "replace string-array `select` with object syntax"

export const findOptionsStringSelect = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // Find object properties named "select" whose value is an array of strings
    root.find(j.ObjectProperty, {
        key: { name: "select" },
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
                    typeof (el as ASTNode & { value: unknown }).value ===
                        "string",
            )
        ) {
            return
        }

        // Convert ["id", "name"] → { id: true, name: true }
        type StringNode = ASTNode & { value: string }
        const properties = (elements as StringNode[]).map((el) =>
            j.property("init", j.identifier(el.value), j.literal(true)),
        )

        path.node.value = j.objectExpression(properties)
        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export default findOptionsStringSelect
