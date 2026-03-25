import path from "node:path"
import type { ASTNode, API, FileInfo } from "jscodeshift"
import { addTodoComment, reportTodo } from "../todo"

export const name = path.basename(__filename, path.extname(__filename))
export const description =
    "replace removed `loadedTables` and `loadedViews` with TODO"
export const manual = true

interface TraversalNode {
    parent?: TraversalNode & {
        node: ASTNode & {
            type: string
            comments?: { value: string }[]
        }
    }
}

export const queryRunnerLoadedTablesViews = (file: FileInfo, api: API) => {
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
        let current: TraversalNode = path
        while (current.parent && current.parent.node.type !== "Program") {
            if (
                current.parent.node.type === "ExpressionStatement" ||
                current.parent.node.type === "VariableDeclaration" ||
                current.parent.node.type === "ReturnStatement"
            ) {
                const stmt = current.parent.node
                const message = `\`${propName}\` was removed in TypeORM v1. Use async \`loadTables()\` / \`loadViews()\` methods instead. See migration guide: https://typeorm.io/docs/guides/migration-v1`

                // Avoid duplicate comments
                const commentValue = ` TODO: ${message}`
                const comments = (stmt.comments = stmt.comments || [])
                const hasSameComment = comments.some(
                    (c) => c.value === commentValue,
                )
                if (!hasSameComment) {
                    addTodoComment(stmt, message, j)
                    hasTodos = true
                }
                hasChanges = true
                break
            }
            current = current.parent
        }
    })

    if (hasTodos) reportTodo(name, file, api)

    return hasChanges ? root.toSource() : undefined
}

export const fn = queryRunnerLoadedTablesViews
export default fn
