import path from "node:path"
import type {
    API,
    FileInfo,
    JSCodeshift,
    ObjectExpression,
    ObjectProperty,
} from "jscodeshift"
import {
    fileImportsFrom,
    getObjectPropertyKeyName,
    getStringValue,
    unwrapTsExpression,
} from "../ast-helpers"
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
// literal value in place. Returns true when a comment was emitted because
// the value was a non-literal we can't safely invert.
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
// resolves to the string literal `"mongodb"` — the gate for all mutations in
// this file.
const isMongoDbOptions = (obj: ObjectExpression): boolean =>
    obj.properties.some(
        (p) =>
            (p.type === "ObjectProperty" || p.type === "Property") &&
            getObjectPropertyKeyName(p) === "type" &&
            getStringValue(unwrapTsExpression(p.value)) === "mongodb",
    )

const REMOVED_PROPS = new Set([
    "useNewUrlParser",
    "useUnifiedTopology",
    "keepAlive",
    "keepAliveInitialDelay",
    "sslCRL",
])

const SIMPLE_RENAMES: Record<string, string> = {
    appname: "appName",
    ssl: "tls",
    sslCA: "tlsCAFile",
    sslCert: "tlsCertificateKeyFile",
    sslKey: "tlsCertificateKeyFile",
    sslPass: "tlsCertificateKeyFilePassword",
}

const WRITE_CONCERN_PROPS = new Set([
    "fsync",
    "j",
    "w",
    "wtimeout",
    "wtimeoutMS",
])

type MutationResult = { changed: boolean; addedTodo: boolean; remove: boolean }

// Classifies a single property inside a MongoDB options object. Returns the
// outcome so the caller can update the bookkeeping flags; `remove: true`
// means the caller must drop the property from the object.
const classifyMongoProperty = (
    prop: ObjectProperty,
    propName: string,
    j: JSCodeshift,
): MutationResult => {
    if (REMOVED_PROPS.has(propName)) {
        return { changed: true, addedTodo: false, remove: true }
    }
    if (SIMPLE_RENAMES[propName]) {
        renamePropertyKey(prop, SIMPLE_RENAMES[propName])
        return { changed: true, addedTodo: false, remove: false }
    }
    if (propName === "sslValidate") {
        const addedTodo = migrateSslValidate(prop, j)
        return { changed: true, addedTodo, remove: false }
    }
    if (WRITE_CONCERN_PROPS.has(propName)) {
        const message = `\`${propName}\` was removed — migrate to \`writeConcern: { ... }\``
        if (hasTodoComment(prop, message)) {
            return { changed: true, addedTodo: false, remove: false }
        }
        addTodoComment(prop, message, j)
        return { changed: true, addedTodo: true, remove: false }
    }
    return { changed: false, addedTodo: false, remove: false }
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

    root.find(j.ObjectExpression).forEach((objPath) => {
        if (!isMongoDbOptions(objPath.node)) return

        const toRemove = new Set<ObjectProperty>()
        for (const prop of objPath.node.properties) {
            if (prop.type !== "ObjectProperty") continue
            const propName = getPropertyKeyName(prop)
            if (propName === null) continue

            const result = classifyMongoProperty(prop, propName, j)
            if (result.changed) hasChanges = true
            if (result.addedTodo) hasTodos = true
            if (result.remove) toRemove.add(prop)
        }

        if (toRemove.size > 0) {
            objPath.node.properties = objPath.node.properties.filter(
                (p) => !toRemove.has(p as ObjectProperty),
            )
        }
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceMongodb
export default fn
