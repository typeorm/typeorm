import type { API, FileInfo, Transform } from "jscodeshift"

export interface TransformModule {
    name: string
    description?: string
    manual?: boolean
    fn: Transform
}

const STATS_PREFIX = "applied:"

export const collectApplied = (
    stats: Record<string, number>,
): Map<string, number> => {
    const applied = new Map<string, number>()

    for (const [key, count] of Object.entries(stats)) {
        if (!key.startsWith(STATS_PREFIX)) continue
        applied.set(key.slice(STATS_PREFIX.length), count)
    }

    return applied
}

export const transformer =
    (transforms: TransformModule[]): Transform =>
    (file: FileInfo, api: API): string | undefined => {
        let source = file.source
        let hasChanges = false

        for (const transform of transforms) {
            const result = transform.fn({ ...file, source }, api, {})

            if (typeof result === "string") {
                source = result
                hasChanges = true
                api.stats(`${STATS_PREFIX}${transform.name}`)
            }
        }

        return hasChanges ? source : undefined
    }
