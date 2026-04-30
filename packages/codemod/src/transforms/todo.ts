import type { JSCodeshift, Node } from "jscodeshift"

// The prefix emitted into user code to guide the v1 migration. This module
// is the single source of truth for the exact wording; every codemod
// transform that flags a manual step routes through `addTodoComment`
// below. The literal on the next line is product output emitted into the
// migrated codebase — not a tech-debt marker for this repo — hence the
// inline NOSONAR suppression.
const TODO_PREFIX = "TODO(typeorm-v1):" // NOSONAR: S1135
const formatTodo = (message: string): string => ` ${TODO_PREFIX} ${message}`

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
 * Returns true when `node` already carries the `message` as a line-comment
 * in any of the recast/babel comment arrays. Used to keep transforms
 * idempotent — running the codemod twice must not stack duplicates.
 *
 * Checks all three comment positions (unified `comments`, Babel's
 * `leadingComments`, and `trailingComments`) because recast sometimes
 * migrates a comment between positions across a re-parse cycle.
 */
export const hasTodoComment = (node: Node, message: string): boolean => {
    const expected = formatTodo(message)
    const buckets: (readonly { value?: string }[] | undefined)[] = [
        node.comments as unknown as readonly { value?: string }[] | undefined,
        (node as unknown as { leadingComments?: readonly { value?: string }[] })
            .leadingComments,
        (
            node as unknown as {
                trailingComments?: readonly { value?: string }[]
            }
        ).trailingComments,
    ]
    return buckets.some((bucket) =>
        (bucket ?? []).some((c) => c.value === expected),
    )
}
