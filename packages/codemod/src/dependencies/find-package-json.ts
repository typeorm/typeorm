import fs from "node:fs"
import path from "node:path"
import { globSync } from "tinyglobby"

/**
 * Finds all package.json files in the given paths recursively,
 * excluding node_modules.
 */
export const findPackageJsonFiles = (paths: string[]): string[] => {
    const results: string[] = []

    for (const p of paths) {
        try {
            const stat = fs.statSync(p, { throwIfNoEntry: false })
            if (!stat) continue

            if (stat.isFile() && path.basename(p) === "package.json") {
                results.push(p)
            } else if (stat.isDirectory()) {
                results.push(
                    ...globSync("**/package.json", {
                        cwd: p,
                        ignore: ["**/node_modules/**"],
                        absolute: true,
                    }),
                )
            }
        } catch {
            // Skip unreadable paths (permission errors, broken symlinks, etc.)
        }
    }

    return [...new Set(results)]
}
