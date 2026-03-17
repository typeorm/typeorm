import fs from "node:fs"
import path from "node:path"
import { versions } from "../transforms"

const TRANSFORMS_DIR = path.join(__dirname, "..", "transforms")

export const listTransforms = (version: string): void => {
    if (!versions[version]) {
        throw new Error(`No transforms found for version "${version}"`)
    }

    const versionDir = path.join(TRANSFORMS_DIR, version)
    const ext = __filename.endsWith(".ts") ? ".ts" : ".js"
    const transforms = fs
        .readdirSync(versionDir)
        .filter((f) => f.endsWith(ext) && f !== `index${ext}`)
        .map((f) => f.replace(ext, ""))
        .sort()

    console.log(`Available transforms for version ${version}:\n`)
    transforms.forEach((t) => console.log(`  - ${t}`))
}
