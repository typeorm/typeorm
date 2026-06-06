import path from "node:path"
import type {
    API,
    FileInfo,
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

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "migrate removed MSSQL `domain` option and fix isolation level format"
export const manual = true

const isolationValueRenames: Record<string, string> = {
    READ_UNCOMMITTED: "READ UNCOMMITTED",
    READ_COMMITTED: "READ COMMITTED",
    REPEATABLE_READ: "REPEATABLE READ",
}

const DOMAIN_MESSAGE =
    '`domain` was removed — restructure to `authentication: { type: "ntlm", options: { domain: "..." } }`'

const isPropertyLike = (
    p: ObjectExpression["properties"][number],
): p is ObjectProperty =>
    p.type === "ObjectProperty" || (p as { type: string }).type === "Property"

const isMssqlOptions = (obj: ObjectExpression): boolean =>
    obj.properties.some(
        (p) =>
            isPropertyLike(p) &&
            getObjectPropertyKeyName(p) === "type" &&
            getStringValue(unwrapTsExpression(p.value)) === "mssql",
    )

// Finds the nested `options: { ... }` ObjectExpression on an MSSQL config.
const findNestedOptionsObject = (
    obj: ObjectExpression,
): ObjectExpression | null => {
    const prop = obj.properties.find(
        (p) =>
            isPropertyLike(p) &&
            getObjectPropertyKeyName(p) === "options" &&
            p.value.type === "ObjectExpression",
    )
    if (!prop || !isPropertyLike(prop)) return null
    return prop.value.type === "ObjectExpression" ? prop.value : null
}

// Flags the top-level `domain` property with a comment pointing at the v1
// replacement. Returns whether a new comment was added.
const flagDomainOption = (
    prop: ObjectProperty,
    api: API,
    j: API["jscodeshift"],
): { changed: boolean; addedTodo: boolean } => {
    if (hasTodoComment(prop, DOMAIN_MESSAGE)) {
        return { changed: true, addedTodo: false }
    }
    addTodoComment(prop, DOMAIN_MESSAGE, j)
    return { changed: true, addedTodo: true }
}

// Rewrites `isolation` → `isolationLevel` and fixes string-literal values
// for (connection)IsolationLevel. Returns whether anything changed.
const rewriteInnerIsolationProp = (prop: ObjectProperty): boolean => {
    if (prop.key.type !== "Identifier") return false

    let changed = false
    if (prop.key.name === "isolation") {
        prop.key.name = "isolationLevel"
        changed = true
    }

    const isIsolationLevel =
        prop.key.name === "isolationLevel" ||
        prop.key.name === "connectionIsolationLevel"
    if (!isIsolationLevel) return changed

    if (prop.value.type !== "StringLiteral") return changed
    const replacement = isolationValueRenames[prop.value.value]
    if (!replacement) return changed

    prop.value.value = replacement
    return true
}

// Flags every top-level `domain` property on an MSSQL options object.
// Returns aggregate changed/addedTodo flags.
const flagDomainOnMssqlOptions = (
    obj: ObjectExpression,
    api: API,
    j: API["jscodeshift"],
): { changed: boolean; addedTodo: boolean } => {
    let changed = false
    let addedTodo = false
    for (const prop of obj.properties) {
        if (!isPropertyLike(prop)) continue
        if (getObjectPropertyKeyName(prop) !== "domain") continue
        const r = flagDomainOption(prop, api, j)
        if (r.changed) changed = true
        if (r.addedTodo) addedTodo = true
    }
    return { changed, addedTodo }
}

// Rewrites `isolation` → `isolationLevel` and normalizes the value on every
// ObjectProperty inside the nested `options: { ... }` object. Returns
// whether any property was rewritten.
const rewriteIsolationOnNestedOptions = (obj: ObjectExpression): boolean => {
    const optionsObj = findNestedOptionsObject(obj)
    if (!optionsObj) return false
    let changed = false
    for (const inner of optionsObj.properties) {
        if (inner.type !== "ObjectProperty") continue
        if (rewriteInnerIsolationProp(inner)) changed = true
    }
    return changed
}

export const datasourceMssql = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)

    if (!fileImportsFrom(root, j, "typeorm")) return undefined

    let hasChanges = false
    let hasTodos = false

    root.find(j.ObjectExpression).forEach((objPath) => {
        const obj = objPath.node
        if (!isMssqlOptions(obj)) return

        const domain = flagDomainOnMssqlOptions(obj, api, j)
        if (domain.changed) hasChanges = true
        if (domain.addedTodo) hasTodos = true

        if (rewriteIsolationOnNestedOptions(obj)) hasChanges = true
    })

    if (hasTodos) stats.count.todo(api, name, file)

    return hasChanges ? root.toSource() : undefined
}

export const fn = datasourceMssql
export default fn
