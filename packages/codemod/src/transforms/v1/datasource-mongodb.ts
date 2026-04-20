import path from "node:path"
import type {
    API,
    FileInfo,
    JSCodeshift,
    ObjectExpression,
    ObjectProperty,
} from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment, hasTodoComment } from "../todo"
import { stats } from "../stats"

const getPropertyKeyName = (prop: ObjectProperty): string | null => {
    if (prop.key.type === "Identifier") return prop.key.name
    if (prop.key.type === "StringLiteral") return prop.key.value
    return null
}

const renamePropertyKey = (prop: ObjectProperty, newName: string): void => {
    if (prop.key.type === "Identifier") prop.key.name = newName
    else if (prop.key.type === "StringLiteral") prop.key.value = newName
}

// Renames `sslValidate` → `tlsAllowInvalidCertificates`, inverting a boolean
// literal value in place. Returns true when a TODO was emitted because the
// value was a non-literal we can't safely invert.
const migrateSslValidate = (prop: ObjectProperty, j: JSCodeshift): boolean => {
    renamePropertyKey(prop, "tlsAllowInvalidCertificates")
    const valueNode = prop.value
    const isBooleanLiteral =
        valueNode.type === "BooleanLiteral" ||
        (valueNode.type === "Literal" && typeof valueNode.value === "boolean")
    if (isBooleanLiteral) {
        ;(valueNode as { value: boolean }).value = !(
            valueNode as { value: boolean }
        ).value
        return false
    }
    const message =
        "`sslValidate` was renamed to `tlsAllowInvalidCertificates` with inverted boolean logic. Review and invert the value."
    if (hasTodoComment(prop, message)) return false
    addTodoComment(prop, message, j)
    return true
}

// Returns true when `obj` has an `ObjectProperty` with key `type` whose value
// is the StringLiteral `"mongodb"` — the gate for all mutations in this file.
const isMongoDbOptions = (obj: ObjectExpression): boolean =>
    obj.properties.some(
        (p) =>
            p.type === "ObjectProperty" &&
            p.key.type === "Identifier" &&
            p.key.name === "type" &&
            p.value.type === "StringLiteral" &&
            p.value.value === "mongodb",
    )

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "remove and rename deprecated MongoDB connection options"
export const manual = true

export const datasourceMongodb = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    const removeProps = new Set([
        "useNewUrlParser",
        "useUnifiedTopology",
        "keepAlive",
        "keepAliveInitialDelay",
        "sslCRL",
    ])

    const simpleRenames: Record<string, string> = {
        appname: "appName",
        ssl: "tls",
        sslCA: "tlsCAFile",
        sslCert: "tlsCertificateKeyFile",
        sslKey: "tlsCertificateKeyFile",
        sslPass: "tlsCertificateKeyFilePassword",
    }

    const writeConcernProps = new Set([
        "fsync",
        "j",
        "w",
        "wtimeout",
        "wtimeoutMS",
    ])

    root.find(j.ObjectExpression).forEach((objPath) => {
        if (!isMongoDbOptions(objPath.node)) return

        // Iterate over a snapshot; `remove()` mutates the live array.
        for (const prop of [...objPath.node.properties]) {
            if (prop.type !== "ObjectProperty") continue
            const propName = getPropertyKeyName(prop)
            if (propName === null) continue

            if (removeProps.has(propName)) {
                objPath.node.properties = objPath.node.properties.filter(
                    (p) => p !== prop,
                )
                hasChanges = true
                continue
            }
            if (simpleRenames[propName]) {
                renamePropertyKey(prop, simpleRenames[propName])
                hasChanges = true
                continue
            }
            if (propName === "sslValidate") {
                if (migrateSslValidate(prop, j)) hasTodos = true
                hasChanges = true
                continue
            }
            if (writeConcernProps.has(propName)) {
                const message = `\`${propName}\` was removed — migrate to \`writeConcern: { ... }\``
                if (!hasTodoComment(prop, message)) {
                    addTodoComment(prop, message, j)
                    hasTodos = true
                }
                hasChanges = true
            }
        }
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceMongodb
export default fn
