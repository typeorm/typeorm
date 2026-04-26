import path from "node:path"
import type { API, FileInfo, ObjectProperty } from "jscodeshift"
import { fileImportsFrom, getStringValue } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "replace object-style `orUpdate()` with array-style signature"

export const queryBuilderOrUpdate = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

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

            const keyName =
                prop.key.type === "Identifier"
                    ? prop.key.name
                    : getStringValue(prop.key)

            if (keyName === "conflict_target") {
                conflictTarget = prop.value
            } else if (keyName === "overwrite") {
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

export const fn = queryBuilderOrUpdate
export default fn
