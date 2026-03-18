import fs from "node:fs"
import path from "node:path"

const TRANSFORMS_DIR = __dirname

const getExt = () => (__filename.endsWith(".ts") ? ".ts" : ".js")

export const getTransformDir = (version: string): string =>
    path.join(TRANSFORMS_DIR, version)

export const getTransformNames = (version: string): string[] => {
    const ext = getExt()
    return fs
        .readdirSync(getTransformDir(version))
        .filter((f) => f.endsWith(ext) && f !== `index${ext}`)
        .map((f) => f.replace(ext, ""))
        .sort()
}

export const getTransformPath = (
    version: string,
    name: string,
): string | null => {
    const ext = getExt()
    const fullPath = path.join(getTransformDir(version), `${name}${ext}`)
    return fs.existsSync(fullPath) ? fullPath : null
}

export const getCompositeTransformPath = (version: string): string => {
    const ext = getExt()
    return path.join(getTransformDir(version), `index${ext}`)
}
