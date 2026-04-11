import type { API, FileInfo, Transform } from "jscodeshift"
import { stats } from "./stats"

export interface TransformModule {
    name: string
    description?: string
    manual?: boolean
    fn: Transform
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
                stats.count.applied(api, transform.name)
            }
        }

        return hasChanges ? source : undefined
    }
