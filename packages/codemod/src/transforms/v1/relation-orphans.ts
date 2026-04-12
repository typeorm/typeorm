import path from "node:path"
import type { API, FileInfo } from "jscodeshift"
import type { ClassProperty, Decorator, ObjectProperty } from "jscodeshift"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "add TODO comments for `orphanedRowAction` usage (rename to `orphans`, move from `@ManyToOne` to `@OneToMany`, and note v2.0 deprecation)"

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
            if (decorator.expression.type !== "CallExpression") continue

            const callee = decorator.expression.callee
            if (callee.type !== "Identifier") continue
            const decoratorName = callee.name

            if (
                decoratorName !== "OneToMany" &&
                decoratorName !== "ManyToOne" &&
                decoratorName !== "ManyToMany" &&
                decoratorName !== "OneToOne"
            )
                continue

            for (const arg of decorator.expression.arguments) {
                if (arg.type !== "ObjectExpression") continue

                const prop = arg.properties.find(
                    (p) =>
                        (p.type === "ObjectProperty" ||
                            p.type === "Property") &&
                        "key" in p &&
                        ((p.key.type === "Identifier" &&
                            p.key.name === "orphanedRowAction") ||
                            (p.key.type === "StringLiteral" &&
                                p.key.value === "orphanedRowAction") ||
                            (p.key.type === "Literal" &&
                                p.key.value === "orphanedRowAction")),
                ) as ObjectProperty | undefined

                if (!prop) continue

                const node = prop as unknown as {
                    comments: unknown[] | null | undefined
                }
                if (node.comments && node.comments.length > 0) continue
                node.comments = []

                if (decoratorName === "OneToMany") {
                    node.comments.push(
                        j.commentLine(
                            ` TODO: rename "orphanedRowAction" to "orphans" — see https://typeorm.io/docs/releases/1.0/upgrading-from-0.3`,
                            true,
                            false,
                        ),
                    )
                    node.comments.push(
                        j.commentLine(
                            ` TODO: the implicit "nullify" default is deprecated and will change in v2.0. Set "orphans" explicitly. See #12343`,
                            true,
                            false,
                        ),
                    )
                } else {
                    node.comments.push(
                        j.commentLine(
                            ` TODO: "orphanedRowAction" is no longer supported on @${decoratorName} in v1.0 — move to the corresponding @OneToMany and rename to "orphans"`,
                            true,
                            false,
                        ),
                    )
                }

                hasChanges = true
            }
        }
    })

    return hasChanges ? root.toSource() : undefined
}

export const fn = relationOrphans
export default fn
