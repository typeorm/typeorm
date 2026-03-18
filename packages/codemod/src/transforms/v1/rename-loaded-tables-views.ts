import type { API, FileInfo } from "jscodeshift"
import { reportTodo } from "../todo"

export const description =
    "replace removed `loadedTables` and `loadedViews` with TODO"
export const manual = true

export const renameLoadedTablesViews = (file: FileInfo, api: API) => {
    const j = api.jscodeshift
    const root = j(file.source)
    let hasChanges = false
    let hasTodos = false

    const removedProps = new Set(["loadedTables", "loadedViews"])

    root.find(j.MemberExpression).forEach((path) => {
        if (path.node.property.type !== "Identifier") return
        if (!removedProps.has(path.node.property.name)) return

        const propName = path.node.property.name

        // Find the containing statement to add a comment
        let current = path as any
        while (current.parent && current.parent.node.type !== "Program") {
            if (
                current.parent.node.type === "ExpressionStatement" ||
                current.parent.node.type === "VariableDeclaration" ||
                current.parent.node.type === "ReturnStatement"
            ) {
                const stmt = current.parent.node
                const comment = j.commentLine(
                    ` TODO: \`${propName}\` was removed in TypeORM v1. Use async \`loadTables()\` / \`loadViews()\` methods instead. See migration guide: https://typeorm.io/docs/guides/migration-v1`,
                )
                stmt.comments = stmt.comments || []

                // Avoid duplicate comments
                const hasSameComment = stmt.comments.some(
                    (c: any) => c.value === comment.value,
                )
                if (!hasSameComment) {
                    stmt.comments.push(comment)
                    comment.leading = true
                    hasTodos = true
                }
                hasChanges = true
                break
            }
            current = current.parent
        }
    })

    if (hasTodos) reportTodo("rename-loaded-tables-views", file, api)

    return hasChanges ? root.toSource() : undefined
}

export default renameLoadedTablesViews
