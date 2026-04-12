import path from "node:path"
import type { API, FileInfo } from "jscodeshift"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "add TODO comments for `orphanedRowAction` usage (rename to `orphans`, move from `@ManyToOne` to `@OneToMany`, and note v2.0 deprecation)"

export const relationOrphans = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // Find all relation decorators
    root.find(j.CallExpression, {
        callee: {
            type: "Identifier",
            name: (n: string) =>
                n === "OneToMany" ||
                n === "ManyToOne" ||
                n === "ManyToMany" ||
                n === "OneToOne",
        },
    }).forEach((callPath) => {
        const decoratorName =
            callPath.node.callee.type === "Identifier"
                ? callPath.node.callee.name
                : "decorator"

        callPath.node.arguments.forEach((arg) => {
            if (arg.type !== "ObjectExpression") return

            const prop = arg.properties.find(
                (p) =>
                    p.type === "ObjectProperty" &&
                    ((p.key.type === "Identifier" &&
                        p.key.name === "orphanedRowAction") ||
                        (p.key.type === "StringLiteral" &&
                            p.key.value === "orphanedRowAction")),
            )

            if (!prop || prop.type !== "ObjectProperty") return
            if (prop.leadingComments) return

            const node = prop as unknown as { comments: unknown[] }
            node.comments = node.comments ?? []

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
        })
    })

    return hasChanges ? root.toSource() : undefined
}

export default relationOrphans
