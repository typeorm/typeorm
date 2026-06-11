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
                // The remainder after the prefix has shape
                // `<transform>:<path>`. The first colon separates the
                // transform name from the file path. Skip malformed keys
                // (no colon, empty transform) rather than producing garbled
                // output via `slice(0, -1)`. File paths on Windows contain
                // `:` (e.g. `C:\...`) so we only split on the FIRST colon,
                // preserving the rest verbatim.
                const colonIdx = rest.indexOf(":")
                if (colonIdx <= 0) continue
                const transform = rest.slice(0, colonIdx)
                const file = rest.slice(colonIdx + 1)
                if (file.length === 0) continue

                const files = grouped.get(transform) ?? []
                files.push(file)
                grouped.set(transform, files)
            }

            return grouped
        },
    },
}
