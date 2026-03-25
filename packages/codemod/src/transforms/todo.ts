import type { API, FileInfo, JSCodeshift, Node } from "jscodeshift"

const PREFIX = "todo:"

export const reportTodo = (
    transform: string,
    file: FileInfo,
    api: API,
): void => {
    api.stats(`${PREFIX}${transform}:${file.path}`)
}

export const collectTodos = (
    stats: Record<string, number>,
): Map<string, string[]> => {
    const grouped = new Map<string, string[]>()

    for (const key of Object.keys(stats)) {
        if (!key.startsWith(PREFIX)) continue

        const rest = key.slice(PREFIX.length)
        const colonIdx = rest.indexOf(":")
        const transform = rest.slice(0, colonIdx)
        const file = rest.slice(colonIdx + 1)

        const files = grouped.get(transform) ?? []
        files.push(file)

        grouped.set(transform, files)
    }

    return grouped
}

export const addTodoComment = (
    node: Node,
    message: string,
    j: JSCodeshift,
): void => {
    if (!node.comments) node.comments = []
    node.comments.push(j.commentLine(` TODO: ${message}`))
}
