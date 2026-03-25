import fs from "node:fs"
import path from "node:path"

/**
 * Finds all package.json files in the given paths (non-recursive for
 * the given directories, but checks common monorepo patterns).
 */
export const findPackageJsonFiles = (paths: string[]): string[] => {
    const results: string[] = []

    for (const p of paths) {
        const stat = fs.statSync(p, { throwIfNoEntry: false })
        if (!stat) continue

        if (stat.isFile() && path.basename(p) === "package.json") {
            results.push(p)
            continue
        }

        if (stat.isDirectory()) {
            const rootPkg = path.join(p, "package.json")
            if (fs.existsSync(rootPkg)) results.push(rootPkg)

            const packagesDir = path.join(p, "packages")
            if (
                fs.existsSync(packagesDir) &&
                fs.statSync(packagesDir).isDirectory()
            ) {
                for (const entry of fs.readdirSync(packagesDir, {
                    withFileTypes: true,
                })) {
                    if (!entry.isDirectory()) continue
                    const pkgFile = path.join(
                        packagesDir,
                        entry.name,
                        "package.json",
                    )
                    if (fs.existsSync(pkgFile)) results.push(pkgFile)
                }
            }
        }
    }

    return [...new Set(results)]
}
