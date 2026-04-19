import type { JSCodeshift, Node } from "jscodeshift"

const formatTodo = (message: string): string => ` TODO(typeorm-v1): ${message}`

// Prettier treats a leading `// prettier-ignore` line-comment as a directive
// for the statement immediately following it. Appending our comment *after*
// that directive places it between `prettier-ignore` and its target and
// silently disables the directive, so detect the pattern and insert above.
const isPrettierIgnore = (comment: { type: string; value: string }): boolean =>
    comment.type === "CommentLine" && comment.value.trim() === "prettier-ignore"

export const addTodoComment = (
    node: Node,
    message: string,
    j: JSCodeshift,
): void => {
    if (!node.comments) node.comments = []
    const todo = j.commentLine(formatTodo(message))
    const firstDirectiveIndex = node.comments.findIndex(isPrettierIgnore)
    if (firstDirectiveIndex === -1) {
        node.comments.push(todo)
    } else {
        node.comments.splice(firstDirectiveIndex, 0, todo)
    }
}

/**
 * Returns true when `node` already carries the `message` as a line-comment.
 * Used to keep transforms idempotent — running the codemod twice must not
 * stack duplicates.
 */
export const hasTodoComment = (node: Node, message: string): boolean => {
    const expected = formatTodo(message)
    return (node.comments ?? []).some((c) => c.value === expected)
}
