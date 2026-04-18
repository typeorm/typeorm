import type { JSCodeshift, Node } from "jscodeshift"

const formatTodo = (message: string): string => ` TODO(typeorm-v1): ${message}`

export const addTodoComment = (
    node: Node,
    message: string,
    j: JSCodeshift,
): void => {
    if (!node.comments) node.comments = []
    node.comments.push(j.commentLine(formatTodo(message)))
}

/**
 * Returns true when `node` already carries a line-comment whose value
 * matches the formatted TODO for `message`. Used to keep transforms
 * idempotent — running the codemod twice must not stack duplicate TODOs.
 */
export const hasTodoComment = (node: Node, message: string): boolean => {
    const expected = formatTodo(message)
    return (node.comments ?? []).some((c) => c.value === expected)
}
