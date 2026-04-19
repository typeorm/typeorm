import path from "node:path"
import type { API, FileInfo, JSCodeshift, ObjectProperty } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

// Returns the key name for a property keyed by Identifier or StringLiteral;
// null for computed / numeric / other key shapes.
const getPropertyKeyName = (prop: ObjectProperty): string | null => {
    if (prop.key.type === "Identifier") return prop.key.name
    if (prop.key.type === "StringLiteral") return prop.key.value
    return null
}

// Renames a property's key in-place (handles both Identifier and StringLiteral).
const renamePropertyKey = (prop: ObjectProperty, newName: string): void => {
    if (prop.key.type === "Identifier") prop.key.name = newName
    else if (prop.key.type === "StringLiteral") prop.key.value = newName
}

// Handles the sslValidate → tlsAllowInvalidCertificates rename, inverting the
// value when it's a boolean literal and emitting a comment otherwise.
// Returns true if a comment was emitted.
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
    addTodoComment(
        prop,
        "`sslValidate` was renamed to `tlsAllowInvalidCertificates` with inverted boolean logic. Review and invert the value.",
        j,
    )
    return true
}

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

    root.find(j.ObjectProperty).forEach((astPath) => {
        const name = getPropertyKeyName(astPath.node)
        if (name === null) return

        if (removeProps.has(name)) {
            j(astPath).remove()
            hasChanges = true
            return
        }
        if (simpleRenames[name]) {
            renamePropertyKey(astPath.node, simpleRenames[name])
            hasChanges = true
            return
        }
        if (name === "sslValidate") {
            if (migrateSslValidate(astPath.node, j)) hasTodos = true
            hasChanges = true
            return
        }
        if (writeConcernProps.has(name)) {
            addTodoComment(
                astPath.node,
                `\`${name}\` was removed — migrate to \`writeConcern: { ... }\``,
                j,
            )
            hasChanges = true
            hasTodos = true
        }
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceMongodb
export default fn
