import type { API, ASTNode, FileInfo, JSCodeshift } from "jscodeshift"

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
    node: ASTNode,
    message: string,
    j: JSCodeshift,
): void => {
    const n = node as ASTNode & { comments?: unknown[] }
    ;(n.comments ??= []).push(j.commentLine(` TODO: ${message}`))
}
