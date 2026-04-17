import type { JSCodeshift, Node } from "jscodeshift"

/**
 * Prefix tag attached to every TODO comment left by the codemod.
 * Kept as a single source of truth so rename/dedup logic cannot drift from
 * the string `addTodoComment` writes.
 */
export const TODO_PREFIX = "TODO(typeorm-v1):"

/**
 * Builds the line-comment text that `addTodoComment` attaches to a node for
 * the given `message`. Shared with `hasTodoComment` so dedup checks match
 * the exact string that will be written.
 */
export const formatTodoLine = (
    message: string,
    prefix: string = TODO_PREFIX,
): string => ` ${prefix} ${message}`

/**
 * Returns true when `node` already carries the exact TODO comment produced
 * by `addTodoComment(node, message, j, prefix)`. Used to keep repeated
 * transform runs idempotent.
 */
export const hasTodoComment = (
    node: Node,
    message: string,
    prefix: string = TODO_PREFIX,
): boolean => {
    const line = formatTodoLine(message, prefix)
    const comments = (node as Node & { comments?: { value: string }[] | null })
        .comments
    return comments?.some((c) => c.value === line) ?? false
}

/**
 * Attaches a TODO line comment to `node`. The prefix is configurable so
 * future codemods (e.g. v2) can reuse this helper without hardcoding the
 * current version tag.
 */
export const addTodoComment = (
    node: Node,
    message: string,
    j: JSCodeshift,
    prefix: string = TODO_PREFIX,
): void => {
    if (!node.comments) node.comments = []
    node.comments.push(j.commentLine(formatTodoLine(message, prefix)))
}
