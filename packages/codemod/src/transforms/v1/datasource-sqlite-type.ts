import path from "node:path"
import type { API, FileInfo, ObjectProperty, Property } from "jscodeshift"
import { getStringValue, setStringValue } from "../ast-helpers"

export const name = path.basename(__filename, path.extname(__filename))
export const description = "replace `sqlite` driver with `better-sqlite3`"

export const datasourceSqliteType = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    let hasChanges = false

    // Scope the rename to ObjectExpressions that look like TypeORM sqlite
    // DataSource options — namely, they carry both `type: "sqlite"` and a
    // sibling `database` property. This keeps the transform from mutating
    // unrelated `{ type: "sqlite" }` objects in non-TypeORM configs and still
    // works on ormconfig-style plain exports that do not import from typeorm.
    // Accept both `Property` (Esprima) and `ObjectProperty` (Babel), as well
    // as both identifier (`type:`) and string-literal (`"type":`) keys.
    root.find(j.ObjectExpression).forEach((objPath) => {
        let typeProp: ObjectProperty | Property | null = null
        let hasDatabase = false

        for (const prop of objPath.node.properties) {
            if (prop.type !== "Property" && prop.type !== "ObjectProperty") {
                continue
            }

            const keyName =
                prop.key.type === "Identifier"
                    ? prop.key.name
                    : getStringValue(prop.key)

            if (keyName === "type" && getStringValue(prop.value) === "sqlite") {
                typeProp = prop
            } else if (keyName === "database") {
                hasDatabase = true
            }
        }

        if (typeProp && hasDatabase) {
            setStringValue(typeProp.value, "better-sqlite3")
            hasChanges = true
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceSqliteType
export default fn
