import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import {
    expandLocalNamesForImports,
    fileImportsFrom,
    getStringValue,
    removeObjectProperties,
} from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "remove deprecated `unsigned` from decimal/float column options"

const numericTypes = new Set(["decimal", "float", "double", "numeric"])
const propertyNames = new Set(["unsigned"])

export const columnUnsignedNumeric = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    // Only match `Column` bindings that resolve to a TypeORM import — a user
    // module with its own `Column` helper (e.g. a schema builder) must not
    // have its second-argument options object touched.
    if (!fileImportsFrom(root, j, "typeorm")) return undefined
    const columnNames = expandLocalNamesForImports(
        root,
        j,
        "typeorm",
        new Set(["Column"]),
    )
    if (columnNames.size === 0) return undefined

    let hasChanges = false

    root.find(j.CallExpression).forEach((path) => {
        const callee = path.node.callee
        if (callee.type !== "Identifier" || !columnNames.has(callee.name))
            return

        const args = path.node.arguments
        if (args.length === 2) {
            const typeName = getStringValue(args[0])
            if (!typeName || !numericTypes.has(typeName)) return
            if (args[1].type !== "ObjectExpression") return
            if (removeObjectProperties(args[1], propertyNames)) {
                hasChanges = true
            }
            return
        }

        if (args.length !== 1) return
        const arg = args[0]
        if (arg.type !== "ObjectExpression") return

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
