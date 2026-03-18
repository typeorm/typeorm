import type { API, FileInfo, Transform } from "jscodeshift"

/**
 * Creates a composite jscodeshift transform that runs multiple
 * transforms in sequence on each file.
 */
export const transformer =
    (transforms: Transform[]): Transform =>
    (file: FileInfo, api: API): string | undefined => {
        let source = file.source
        let hasChanges = false

        for (const transform of transforms) {
            const result = transform({ ...file, source }, api, {})

            if (typeof result === "string") {
                source = result
                hasChanges = true
            }
        }

        return hasChanges ? source : undefined
    }
