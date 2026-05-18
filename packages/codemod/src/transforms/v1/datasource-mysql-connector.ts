import path from "node:path"
import type { API, FileInfo, ObjectExpression } from "jscodeshift"
import {
    fileImportsFrom,
    getObjectPropertyKeyName,
    getStringValue,
    unwrapTsExpression,
} from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "remove deprecated `connectorPackage` option from MySQL/MariaDB config"

// Matches `{ type: "mysql" | "mariadb", ... }` objects — the only places
// where `connectorPackage` was a valid TypeORM option. Accepts both
// identifier and string-literal keys, and peels TS wrappers so
// `type: "mysql" as const` also matches.
const isMysqlOrMariadbOptions = (obj: ObjectExpression): boolean =>
    obj.properties.some((p) => {
        if (p.type !== "ObjectProperty" && p.type !== "Property") return false
        if (getObjectPropertyKeyName(p) !== "type") return false
        const literal = getStringValue(unwrapTsExpression(p.value))
        return literal === "mysql" || literal === "mariadb"
    })

export const datasourceMysqlConnector = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false

    root.find(j.ObjectExpression).forEach((objPath) => {
        if (!isMysqlOrMariadbOptions(objPath.node)) return

        const filtered = objPath.node.properties.filter(
            (p) =>
                !(
                    (p.type === "ObjectProperty" || p.type === "Property") &&
                    getObjectPropertyKeyName(p) === "connectorPackage"
                ),
        )
        if (filtered.length !== objPath.node.properties.length) {
            objPath.node.properties = filtered
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceMysqlConnector
export default fn
