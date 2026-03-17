import path from "node:path"
import fs from "node:fs"
import { fail } from "./error"
import { listTransforms } from "./list-transforms"
import { versions } from "../transforms"

const TRANSFORMS_DIR = path.join(__dirname, "..", "transforms")

export const resolveTransforms = (
    version: string,
    transform?: string,
): string[] => {
    if (!versions[version]) {
        fail(`no transforms found for version "${version}"`)
    }

    const versionDir = path.join(TRANSFORMS_DIR, version)
    const ext = __filename.endsWith(".ts") ? ".ts" : ".js"

    if (transform) {
        const transformPath = path.join(versionDir, `${transform}${ext}`)

        if (!fs.existsSync(transformPath)) {
            fail(
                `transform "${transform}" not found for version "${version}"`,
                () => listTransforms(version),
            )
        }

        return [transformPath]
    }

    // Use the composite index that runs all transforms in order
    return [path.join(versionDir, `index${ext}`)]
}
