import path from "node:path"
import type { API, FileInfo } from "jscodeshift"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "add TODO comments for `orphanedRowAction` on `@ManyToOne` (must be moved to `@OneToMany`)"

export const relationOrphanedRowAction = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false

    // Find all call expressions that are decorators (ManyToOne, ManyToMany)
    root.find(j.CallExpression, {
        callee: {
            type: "Identifier",
            name: (n: string) => n === "ManyToOne" || n === "ManyToMany",
        },
    }).forEach((callPath) => {
        // Check each argument for an object with orphanedRowAction
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

            if (!prop) return

            // Add a TODO comment before the property
            const decoratorName =
                callPath.node.callee.type === "Identifier"
                    ? callPath.node.callee.name
                    : "decorator"

            if (!prop.leadingComments) {
                const node = prop as unknown as { comments: unknown[] }
                node.comments = node.comments ?? []
                node.comments.push(
                    j.commentLine(
                        ` TODO: orphanedRowAction on @${decoratorName} is no longer supported in v1.0 — move to @OneToMany`,
                        true,
                        false,
                    ),
                )
                hasChanges = true
            }
        })
    })

    return hasChanges ? root.toSource() : undefined
}

export default relationOrphanedRowAction
