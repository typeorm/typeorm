import type { API } from "jscodeshift"

const APPLIED_PREFIX = "applied:"

export const stats = {
    count: {
        applied: (api: API, name: string): void => {
            api.stats(`${APPLIED_PREFIX}${name}`)
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
    },
}
