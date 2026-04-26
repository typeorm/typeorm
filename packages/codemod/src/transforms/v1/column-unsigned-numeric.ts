import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { getStringValue, removeObjectProperties } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "remove deprecated `unsigned` from decimal/float column options"

const numericTypes = new Set(["decimal", "float", "double", "numeric"])
const propertyNames = new Set(["unsigned"])

export const columnUnsignedNumeric = (file: FileInfo, api: API) => {
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

        if (removeObjectProperties(secondArg, propertyNames)) {
            hasChanges = true
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
        const typeProp = arg.properties.find((p) => {
            if (p.type !== "ObjectProperty") return false
            const keyName =
                p.key.type === "Identifier" ? p.key.name : getStringValue(p.key)
            return keyName === "type"
        })

        if (typeProp?.type !== "ObjectProperty") return

        const typeValue = getStringValue(typeProp.value)

        if (!typeValue || !numericTypes.has(typeValue)) return

        if (removeObjectProperties(arg, propertyNames)) {
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = columnUnsignedNumeric
export default fn
