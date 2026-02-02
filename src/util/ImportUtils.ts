import fs from "fs/promises"
import path from "path"
import { pathToFileURL } from "url"

/**
 *
 * @param filePath
 */
export async function importOrRequireFile(
    filePath: string,
): Promise<[any, "esm" | "commonjs"]> {
    const tryToImport = async (): Promise<[any, "esm"]> => {
        if (process.env.VITEST) {
            return [await import(filePath), "esm"]
        }
        // `Function` is required to make sure the `import` statement wil stay `import` after
        // transpilation and won't be converted to `require`
        return [
            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            await Function("return filePath => import(filePath)")()(
                filePath.startsWith("file://")
                    ? filePath
                    : pathToFileURL(filePath).toString(),
            ),
            "esm",
        ]
    }
    const tryToRequire = (): [any, "commonjs"] => {
        return [require(filePath), "commonjs"]
    }

    if (process.env.VITEST) {
        return tryToImport()
    }

    const extension = filePath.substring(filePath.lastIndexOf(".") + ".".length)

    if (extension === "mjs" || extension === "mts") return tryToImport()
    else if (extension === "cjs" || extension === "cts") return tryToRequire()
    else if (extension === "js" || extension === "ts") {
        const packageJson = await getNearestPackageJson(filePath)

        if (packageJson != null) {
            const isModule = (packageJson as any)?.type === "module"

            if (isModule) return tryToImport()
            else return tryToRequire()
        } else return tryToRequire()
    }

    return tryToRequire()
}

const packageJsonCache = new Map<string, object | null>()
const MAX_CACHE_SIZE = 1000

/**
 *
 * @param paths
 * @param packageJson
 */
function setPackageJsonCache(paths: string[], packageJson: object | null) {
    for (const path of paths) {
        // Simple LRU-like behavior: if we're at capacity, remove oldest entry
        if (
            packageJsonCache.size >= MAX_CACHE_SIZE &&
            !packageJsonCache.has(path)
        ) {
            const firstKey = packageJsonCache.keys().next().value
            if (firstKey) packageJsonCache.delete(firstKey)
        }
        packageJsonCache.set(path, packageJson)
    }
}

/**
 *
 * @param filePath
 */
async function getNearestPackageJson(filePath: string): Promise<object | null> {
    let currentPath = filePath
    const paths: string[] = []

    while (currentPath !== path.dirname(currentPath)) {
        currentPath = path.dirname(currentPath)

        // Check if we have already cached the package.json for this path
        if (packageJsonCache.has(currentPath)) {
            setPackageJsonCache(paths, packageJsonCache.get(currentPath)!)
            return packageJsonCache.get(currentPath)!
        }

        // Add the current path to the list of paths to cache
        paths.push(currentPath)

        const potentialPackageJson = path.join(currentPath, "package.json")

        try {
            const stats = await fs.stat(potentialPackageJson)
            if (!stats.isFile()) {
                continue
            }

            try {
                const parsedPackage = JSON.parse(
                    await fs.readFile(potentialPackageJson, "utf8"),
                )
                // Cache the parsed package.json object and return it
                setPackageJsonCache(paths, parsedPackage)
                return parsedPackage
            } catch {
                // If parsing fails, we still cache null to avoid repeated attempts
                setPackageJsonCache(paths, null)
                return null
            }
        } catch {
            continue
        }
    }

    // the top of the file tree is reached
    setPackageJsonCache(paths, null)
    return null
}
