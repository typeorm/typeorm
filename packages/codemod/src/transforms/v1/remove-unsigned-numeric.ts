import type { API, FileInfo } from "jscodeshift"
import { getStringValue } from "../ast-helpers"

export const description =
    "remove deprecated `unsigned` from decimal/float column options"

const numericTypes = new Set(["decimal", "float", "double", "numeric"])

export const removeUnsignedNumeric = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // Find @Column("decimal", { unsigned: true }) style calls
    root.find(j.CallExpression, {
        callee: { type: "Identifier", name: "Column" },
    }).forEach((path) => {
        const args = path.node.arguments
        if (args.length < 2) return

        // First arg must be a string literal with a numeric type
        const firstArg = args[0]
        const typeName = getStringValue(firstArg)

        if (!typeName || !numericTypes.has(typeName)) return

        // Second arg should be an object with unsigned property
        const secondArg = args[1]
        if (secondArg.type !== "ObjectExpression") return

        const filtered = secondArg.properties.filter((prop) => {
            if (
                prop.type === "ObjectProperty" &&
                prop.key.type === "Identifier" &&
                prop.key.name === "unsigned"
            ) {
                hasChanges = true
                return false
            }
            return true
        })

        if (filtered.length !== secondArg.properties.length) {
            secondArg.properties = filtered
        }
    })

    // Also find decorator calls via @Column({ type: "decimal", unsigned: true })
    root.find(j.CallExpression, {
        callee: { type: "Identifier", name: "Column" },
    }).forEach((path) => {
        const args = path.node.arguments
        if (args.length !== 1) return

        const arg = args[0]
        if (arg.type !== "ObjectExpression") return

        // Check if type is a numeric type
        const typeProp = arg.properties.find(
            (p) =>
                p.type === "ObjectProperty" &&
                p.key.type === "Identifier" &&
                p.key.name === "type",
        )

        if (typeProp?.type !== "ObjectProperty") return

        const typeValue = getStringValue(typeProp.value)

        if (!typeValue || !numericTypes.has(typeValue)) return

        const filtered = arg.properties.filter((prop) => {
            if (
                prop.type === "ObjectProperty" &&
                prop.key.type === "Identifier" &&
                prop.key.name === "unsigned"
            ) {
                hasChanges = true
                return false
            }
            return true
        })

        if (filtered.length !== arg.properties.length) {
            arg.properties = filtered
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export default removeUnsignedNumeric
