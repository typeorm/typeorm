import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import { fileImportsFrom } from "../ast-helpers"
import { addTodoComment } from "../todo"
import { stats } from "../stats"

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

        // sslValidate → tlsAllowInvalidCertificates. Semantics are inverted:
        // when the original value is a boolean literal we can safely flip it;
        // otherwise we leave the expression alone and emit a TODO so the user
        // inverts it manually.
        if (name === "sslValidate") {
            if (path.node.key.type === "Identifier") {
                path.node.key.name = "tlsAllowInvalidCertificates"
            } else if (path.node.key.type === "StringLiteral") {
                path.node.key.value = "tlsAllowInvalidCertificates"
            }
            const valueNode = path.node.value
            if (
                valueNode.type === "BooleanLiteral" ||
                (valueNode.type === "Literal" &&
                    typeof valueNode.value === "boolean")
            ) {
                valueNode.value = !valueNode.value
            } else {
                addTodoComment(
                    path.node,
                    "`sslValidate` was renamed to `tlsAllowInvalidCertificates` with inverted boolean logic. Review and invert the value.",
                    j,
                )
                hasTodos = true
            }
            hasChanges = true
            return
        }

        // writeConcern-related props → add TODO
        if (writeConcernProps.has(name)) {
            addTodoComment(
                path.node,
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
