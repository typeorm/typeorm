import path from "node:path"
import fs from "node:fs"
import { versions } from "../transforms"

const TRANSFORMS_DIR = path.join(__dirname, "..", "transforms")

export const resolveTransforms = (
    version: string,
    transform?: string,
): string[] => {
    if (!versions[version]) {
        console.error(`No transforms found for version "${version}"`)
        console.error(`Available versions: ${Object.keys(versions).join(", ")}`)
        process.exit(1)
    }

    const versionDir = path.join(TRANSFORMS_DIR, version)
    const ext = __filename.endsWith(".ts") ? ".ts" : ".js"

    if (transform) {
        const transformPath = path.join(versionDir, `${transform}${ext}`)

        if (!fs.existsSync(transformPath)) {
            throw new Error(
                `Transform "${transform}" not found for version "${version}"`,
            )
        }

        return [transformPath]
    }

    // Use the composite index that runs all transforms in order
    return [path.join(versionDir, `index${ext}`)]
}
