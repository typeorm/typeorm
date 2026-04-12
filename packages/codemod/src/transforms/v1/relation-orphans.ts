import path from "node:path"
import type {
    API,
    ClassProperty,
    Decorator,
    FileInfo,
    JSCodeshift,
    ObjectProperty,
} from "jscodeshift"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "add TODO comments for `orphanedRowAction` usage (rename to `orphans`, move from `@ManyToOne` to `@OneToMany`, and note v2.0 deprecation)"

const RELATION_DECORATORS = new Set([
    "OneToMany",
    "ManyToOne",
    "ManyToMany",
    "OneToOne",
])

type CommentCarrier = { comments: unknown[] | null | undefined }

const isOrphanedRowActionKey = (prop: ObjectProperty): boolean => {
    const key = prop.key
    if (key.type === "Identifier") return key.name === "orphanedRowAction"
    if (key.type === "StringLiteral" || key.type === "Literal")
        return key.value === "orphanedRowAction"
    return false
}

const findOrphanedRowActionProp = (
    properties: readonly unknown[],
): ObjectProperty | undefined => {
    for (const p of properties) {
        const prop = p as ObjectProperty
        if (
            (prop.type === "ObjectProperty" || prop.type === "Property") &&
            isOrphanedRowActionKey(prop)
        ) {
            return prop
        }
    }
    return undefined
}

const buildCommentsFor = (j: JSCodeshift, decoratorName: string): unknown[] => {
    if (decoratorName === "OneToMany") {
        return [
            j.commentLine(
                ` TODO: rename "orphanedRowAction" to "orphans" — see https://typeorm.io/docs/releases/1.0/upgrading-from-0.3`,
                true,
                false,
            ),
            j.commentLine(
                ` TODO: the implicit "nullify" default is deprecated and will change in v2.0. Set "orphans" explicitly. See #12343`,
                true,
                false,
            ),
        ]
    }
    return [
        j.commentLine(
            ` TODO: "orphanedRowAction" is no longer supported on @${decoratorName} in v1.0 — move to the corresponding @OneToMany and rename to "orphans"`,
            true,
            false,
        ),
    ]
}

const getDecoratorName = (decorator: Decorator): string | undefined => {
    if (decorator.expression.type !== "CallExpression") return undefined
    const callee = decorator.expression.callee
    if (callee.type !== "Identifier") return undefined
    return RELATION_DECORATORS.has(callee.name) ? callee.name : undefined
}

const annotateDecorator = (
    j: JSCodeshift,
    decorator: Decorator,
    decoratorName: string,
): boolean => {
    if (decorator.expression.type !== "CallExpression") return false
    let hasChanges = false

    for (const arg of decorator.expression.arguments) {
        if (arg.type !== "ObjectExpression") continue

        const prop = findOrphanedRowActionProp(arg.properties)
        if (!prop) continue

        const carrier = prop as unknown as CommentCarrier
        if (carrier.comments && carrier.comments.length > 0) continue

        carrier.comments = buildCommentsFor(j, decoratorName)
        hasChanges = true
    }
    return hasChanges
}

export const relationOrphans = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    root.find(j.ClassProperty).forEach((classPropPath) => {
        // ast-types omits `decorators` from ClassProperty — extend it
        const classProp = classPropPath.node as ClassProperty & {
            decorators?: Decorator[]
        }
        if (!classProp.decorators) return

        for (const decorator of classProp.decorators) {
            const decoratorName = getDecoratorName(decorator)
            if (!decoratorName) continue

            if (annotateDecorator(j, decorator, decoratorName)) {
                hasChanges = true
            }
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = relationOrphans
export default fn
