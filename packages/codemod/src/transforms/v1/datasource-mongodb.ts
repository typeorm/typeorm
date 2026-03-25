import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment, reportTodo } from "../todo"

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

    // Remove deprecated options
    root.find(j.ObjectProperty).forEach((path) => {
        if (
            path.node.key.type !== "Identifier" &&
            path.node.key.type !== "StringLiteral"
        ) {
            return
        }

        const name =
            path.node.key.type === "Identifier"
                ? path.node.key.name
                : path.node.key.value

        if (removeProps.has(name)) {
            j(path).remove()
            hasChanges = true
            return
        }

        // Simple renames
        if (simpleRenames[name]) {
            if (path.node.key.type === "Identifier") {
                path.node.key.name = simpleRenames[name]
            } else if (path.node.key.type === "StringLiteral") {
                path.node.key.value = simpleRenames[name]
            }
            hasChanges = true
            return
        }

        // sslValidate → tlsAllowInvalidCertificates (inverted boolean — add TODO)
        if (name === "sslValidate") {
            if (path.node.key.type === "Identifier") {
                path.node.key.name = "tlsAllowInvalidCertificates"
            } else if (path.node.key.type === "StringLiteral") {
                path.node.key.value = "tlsAllowInvalidCertificates"
            }
            // Add TODO comment about inverted boolean
            addTodoComment(
                path.node,
                "`sslValidate` was renamed to `tlsAllowInvalidCertificates` with inverted boolean logic. Review and invert the value.",
                j,
            )
            hasChanges = true
            hasTodos = true
            return
        }

        // writeConcern-related props → add TODO
        if (writeConcernProps.has(name)) {
            addTodoComment(
                path.node,
                `\`${name}\` was removed in TypeORM v1. Migrate to \`writeConcern: { ... }\`. See migration guide: https://typeorm.io/docs/guides/migration-v1`,
                j,
            )
            hasChanges = true
            hasTodos = true
        }
    })

    if (hasTodos) reportTodo(name, file, api)

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceMongodb
export default fn
