import type { JSCodeshift, Node } from "jscodeshift"

export const addTodoComment = (
    node: Node,
    message: string,
    j: JSCodeshift,
): void => {
    if (!node.comments) node.comments = []
    node.comments.push(j.commentLine(` TODO(typeorm-v1): ${message}`))
}
