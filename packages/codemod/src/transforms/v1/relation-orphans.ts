import path from "node:path"
import type { API, FileInfo } from "jscodeshift"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "rename `orphanedRowAction` to `orphans` on `@OneToMany`, and flag usage on `@ManyToOne`/`@ManyToMany` for manual migration"

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

            if (decoratorName === "OneToMany") {
                // Rename the property key from orphanedRowAction to orphans
                if (
                    prop.key.type === "Identifier" &&
                    prop.key.name === "orphanedRowAction"
                ) {
                    prop.key.name = "orphans"
                    hasChanges = true
                } else if (
                    prop.key.type === "StringLiteral" &&
                    prop.key.value === "orphanedRowAction"
                ) {
                    prop.key.value = "orphans"
                    hasChanges = true
                }
            } else {
                // @ManyToOne, @ManyToMany, @OneToOne — no longer supported, flag for manual migration
                if (!prop.leadingComments) {
                    const node = prop as unknown as { comments: unknown[] }
                    node.comments = node.comments ?? []
                    node.comments.push(
                        j.commentLine(
                            ` TODO: orphanedRowAction is no longer supported on @${decoratorName} in v1.0 — move to the corresponding @OneToMany as "orphans"`,
                            true,
                            false,
                        ),
                    )
                    hasChanges = true
                }
            }
        })
    })

    return hasChanges ? root.toSource() : undefined
}

export default relationOrphans
