import path from "node:path"
import fs from "node:fs"

const TRANSFORMS_DIR = path.join(__dirname, "..", "transforms")

export const resolveTransforms = (
    version: string,
    transform?: string,
): string[] => {
    const versionDir = path.join(TRANSFORMS_DIR, version)

    if (transform) {
        const transformPath = path.join(versionDir, `${transform}.js`)

        if (!fs.existsSync(transformPath)) {
            throw new Error(
                `Transform "${transform}" not found for version "${version}"`,
            )
        }

        return [transformPath]
    }

    // Use the composite index that runs all transforms in order
    return [path.join(versionDir, "index.js")]
}
