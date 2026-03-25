import type { API, FileInfo, ObjectProperty } from "jscodeshift"

export const description =
    "replace object-style `orUpdate()` with array-style signature"

export const queryBuilderOrUpdate = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // Find .orUpdate({ conflict_target: [...], overwrite: [...] })
    root.find(j.CallExpression, {
        callee: {
            type: "MemberExpression",
            property: { type: "Identifier", name: "orUpdate" },
        },
    }).forEach((path) => {
        const args = path.node.arguments
        if (args.length !== 1) return

        const arg = args[0]
        if (arg.type !== "ObjectExpression") return

        let conflictTarget: ObjectProperty["value"] | null = null
        let overwrite: ObjectProperty["value"] | null = null

        for (const prop of arg.properties) {
            if (prop.type !== "ObjectProperty") continue
            if (prop.key.type !== "Identifier") continue

            if (prop.key.name === "conflict_target") {
                conflictTarget = prop.value
            } else if (prop.key.name === "overwrite") {
                overwrite = prop.value
            }
        }

        if (!conflictTarget || !overwrite) return

        // Transform to .orUpdate([overwrite], [conflict_target])
        // Values are always expressions at runtime (array literals from object properties)
        path.node.arguments = [
            overwrite,
            conflictTarget,
        ] as typeof path.node.arguments
        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export default queryBuilderOrUpdate
