import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import {
    fileImportsFrom,
    getObjectPropertyKeyName,
    getStringValue,
    unwrapTsExpression,
} from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "migrate removed MSSQL `domain` option and fix isolation level format"
export const manual = true

const isolationValueRenames: Record<string, string> = {
    READ_UNCOMMITTED: "READ UNCOMMITTED",
    READ_COMMITTED: "READ COMMITTED",
    REPEATABLE_READ: "REPEATABLE READ",
}

export const datasourceMssql = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    root.find(j.ObjectExpression).forEach((objPath) => {
        const props = objPath.node.properties
        const isMssql = props.some(
            (p) =>
                (p.type === "ObjectProperty" || p.type === "Property") &&
                getObjectPropertyKeyName(p) === "type" &&
                getStringValue(unwrapTsExpression(p.value)) === "mssql",
        )
        if (!isMssql) return

        for (const prop of props) {
            if (
                (prop.type === "ObjectProperty" || prop.type === "Property") &&
                getObjectPropertyKeyName(prop) === "domain"
            ) {
                const message =
                    '`domain` was removed — restructure to `authentication: { type: "ntlm", options: { domain: "..." } }`'
                if (!hasTodoComment(prop, message)) {
                    addTodoComment(prop, message, j)
                    hasTodos = true
                }
                hasChanges = true
            }
        }

        const optionsProp = props.find(
            (p) =>
                (p.type === "ObjectProperty" || p.type === "Property") &&
                getObjectPropertyKeyName(p) === "options" &&
                p.value.type === "ObjectExpression",
        )
        if (
            (optionsProp?.type !== "ObjectProperty" &&
                optionsProp?.type !== "Property") ||
            optionsProp.value.type !== "ObjectExpression"
        )
            return

        for (const innerProp of optionsProp.value.properties) {
            if (
                innerProp.type !== "ObjectProperty" ||
                innerProp.key.type !== "Identifier"
            )
                continue

            // Rename `isolation` → `isolationLevel`
            if (innerProp.key.name === "isolation") {
                innerProp.key.name = "isolationLevel"
                hasChanges = true
            }

            // Fix isolation value format on isolationLevel / connectionIsolationLevel
            if (
                (innerProp.key.name === "isolationLevel" ||
                    innerProp.key.name === "connectionIsolationLevel") &&
                innerProp.value.type === "StringLiteral" &&
                isolationValueRenames[innerProp.value.value]
            ) {
                innerProp.value.value =
                    isolationValueRenames[innerProp.value.value]
                hasChanges = true
            }
        }
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceMssql
export default fn
