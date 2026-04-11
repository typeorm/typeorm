import type { API, FileInfo } from "jscodeshift"

const APPLIED_PREFIX = "applied:"
const TODO_PREFIX = "todo:"

export const stats = {
    count: {
        applied: (api: API, name: string): void => {
            api.stats(`${APPLIED_PREFIX}${name}`)
        },

        todo: (api: API, name: string, file: FileInfo): void => {
            api.stats(`${TODO_PREFIX}${name}:${file.path}`)
        },
    },

    collect: {
        applied: (raw: Record<string, number>): Map<string, number> => {
            const applied = new Map<string, number>()

            for (const [key, count] of Object.entries(raw)) {
                if (!key.startsWith(APPLIED_PREFIX)) continue
                applied.set(key.slice(APPLIED_PREFIX.length), count)
            }

            return applied
        },

        todos: (raw: Record<string, number>): Map<string, string[]> => {
            const grouped = new Map<string, string[]>()

            for (const key of Object.keys(raw)) {
                if (!key.startsWith(TODO_PREFIX)) continue

                const rest = key.slice(TODO_PREFIX.length)
                const colonIdx = rest.indexOf(":")
                const transform = rest.slice(0, colonIdx)
                const file = rest.slice(colonIdx + 1)

                const files = grouped.get(transform) ?? []
                files.push(file)
                grouped.set(transform, files)
            }

            return grouped
        },
    },
}
