import fs from "fs/promises"
import path from "path"
import { pathToFileURL } from "url"

export async function importOrRequireFile(
    filePath: string,
    packageMap: Map<string, any> | undefined = undefined,
): Promise<[any, "esm" | "commonjs"]> {
    const tryToImport = async (): Promise<[any, "esm"]> => {
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

    const extension = filePath.substring(filePath.lastIndexOf(".") + ".".length)
    const dirname = path.dirname(filePath)
    if (extension === "mjs" || extension === "mts") return tryToImport()
    else if (extension === "cjs" || extension === "cts") return tryToRequire()
    else if (extension === "js" || extension === "ts") {
        if (packageMap?.has(filePath)) {
            const packageJson = packageMap.get(dirname)
            const isModule = (packageJson as any)?.type === "module"
            if (isModule) return tryToImport()
            else return tryToRequire()
        }
        const packageJson = await getNearestPackageJson(filePath)
        if (packageMap) packageMap.set(dirname, packageJson)
        if (packageJson != null) {
            const isModule = (packageJson as any)?.type === "module"

            if (isModule) return tryToImport()
            else return tryToRequire()
        } else return tryToRequire()
    }

    return tryToRequire()
}

async function getNearestPackageJson(filePath: string): Promise<object | null> {
    let currentPath = filePath

    while (currentPath !== path.dirname(currentPath)) {
        currentPath = path.dirname(currentPath)
        const potentialPackageJson = path.join(currentPath, "package.json")

        try {
            const stats = await fs.stat(potentialPackageJson)
            if (!stats.isFile()) {
                continue
            }

            try {
                return JSON.parse(
                    await fs.readFile(potentialPackageJson, "utf8"),
                )
            } catch {
                return null
            }
        } catch {
            continue
        }
    }

    // the top of the file tree is reached
    return null
}
