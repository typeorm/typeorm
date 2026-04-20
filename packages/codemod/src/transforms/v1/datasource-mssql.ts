import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment } from "../todo"
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

    // Find object literals with `type: "mssql"`
    root.find(j.ObjectExpression).forEach((objPath) => {
        const props = objPath.node.properties
        const isMssql = props.some(
            (p) =>
                p.type === "ObjectProperty" &&
                p.key.type === "Identifier" &&
                p.key.name === "type" &&
                p.value.type === "StringLiteral" &&
                p.value.value === "mssql",
        )
        if (!isMssql) return

        for (const prop of props) {
            if (
                prop.type === "ObjectProperty" &&
                prop.key.type === "Identifier" &&
                prop.key.name === "domain"
            ) {
                addTodoComment(
                    prop,
                    '`domain` was removed — restructure to `authentication: { type: "ntlm", options: { domain: "..." } }`',
                    j,
                )
                hasChanges = true
                hasTodos = true
            }
        }

        // Find the `options` nested object
        const optionsProp = props.find(
            (p) =>
                p.type === "ObjectProperty" &&
                p.key.type === "Identifier" &&
                p.key.name === "options" &&
                p.value.type === "ObjectExpression",
        )
        if (
            optionsProp?.type !== "ObjectProperty" ||
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
