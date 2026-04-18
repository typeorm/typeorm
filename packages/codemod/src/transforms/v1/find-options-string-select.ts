import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { fileImportsFrom, getStringValue } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "replace string-array `select` with object syntax"

export const findOptionsStringSelect = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false

    // Find object properties named "select" whose value is an array of strings
    root.find(j.ObjectProperty, {
        key: { name: "select" },
    }).forEach((path) => {
        const value = path.node.value
        if (value.type !== "ArrayExpression") return

        const elements = value.elements
        const strings = elements.map((el) => el && getStringValue(el))
        if (strings.some((s) => s === null || s === undefined)) return

        // Convert ["id", "name"] → { id: true, name: true }
        const properties = (strings as string[]).map((s) =>
            j.property("init", j.identifier(s), j.literal(true)),
        )

        path.node.value = j.objectExpression(properties)
        hasChanges = true
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = findOptionsStringSelect
export default fn
