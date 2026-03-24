import fs from "node:fs"
import path from "node:path"
import semver from "semver"

export interface DependencyReport {
    file: string
    changes: string[]
    warnings: string[]
    errors: string[]
}

/** Packages to replace (old → new package name + version). */
const replacements: Record<string, { replacement: string; version: string }> = {
    sqlite3: { replacement: "better-sqlite3", version: "^12.8.0" },
    mysql: { replacement: "mysql2", version: "^3.20.0" },
}

/** TypeORM v1 target version. */
const TYPEORM_VERSION = "^1.0.0-beta.1"

/** Minimum supported versions from TypeORM v1 peerDependencies. */
const minimumVersions: Record<string, string> = {
    typeorm: TYPEORM_VERSION,
    mongodb: "^7.0.0",
    mysql2: "^3.15.3",
    mssql: "^12.0.0",
    "better-sqlite3": "^12.0.0",
    "@google-cloud/spanner": "^8.0.0",
    redis: "^5.0.0",
    ioredis: "^5.0.4",
    "typeorm-aurora-data-api-driver": "^3.0.0",
}

/** Packages that are incompatible with TypeORM v1 (hard errors). */
const incompatiblePackages: Record<string, string> = {
    "typeorm-typedi-extensions":
        "`typeorm-typedi-extensions` is incompatible with TypeORM v1 — the IoC container system (`useContainer`) was removed. See migration guide.",
    "typeorm-routing-controllers-extensions":
        "`typeorm-routing-controllers-extensions` is incompatible with TypeORM v1 — the IoC container system (`useContainer`) was removed. See migration guide.",
}

/** Minimum required Node.js version for TypeORM v1. */
const MIN_NODE_VERSION = "20.0.0"

/**
 * Upgrades dependencies in a single package.json file for TypeORM v1.
 */
export const upgradeDependencies = (
    filePath: string,
    dry: boolean,
): DependencyReport => {
    const report: DependencyReport = {
        file: filePath,
        changes: [],
        warnings: [],
        errors: [],
    }

    const raw = fs.readFileSync(filePath, "utf8")
    const pkg = JSON.parse(raw)
    let modified = false

    const depSections = [
        "dependencies",
        "devDependencies",
        "peerDependencies",
        "optionalDependencies",
    ] as const

    // Replace deprecated packages
    for (const [oldPkg, { replacement, version }] of Object.entries(
        replacements,
    )) {
        for (const section of depSections) {
            if (pkg[section]?.[oldPkg]) {
                delete pkg[section][oldPkg]
                if (!pkg[section][replacement]) {
                    pkg[section][replacement] = version
                    report.changes.push(
                        `${section}: replaced \`${oldPkg}\` with \`${replacement}@${version}\``,
                    )
                } else {
                    report.changes.push(
                        `${section}: removed \`${oldPkg}\` (${replacement} already present)`,
                    )
                }
                modified = true
            }
        }
    }

    // Bump versions below minimum
    for (const [pkgName, minRange] of Object.entries(minimumVersions)) {
        for (const section of depSections) {
            const current = pkg[section]?.[pkgName]
            if (!current) continue

            const currentMin = semver.minVersion(current)
            const requiredMin = semver.minVersion(minRange)
            if (
                currentMin &&
                requiredMin &&
                semver.lt(currentMin, requiredMin)
            ) {
                pkg[section][pkgName] = minRange
                report.changes.push(
                    `${section}: bumped \`${pkgName}\` from \`${current}\` to \`${minRange}\``,
                )
                modified = true
            }
        }
    }

    // Check for incompatible packages (hard errors)
    for (const [pkgName, message] of Object.entries(incompatiblePackages)) {
        for (const section of depSections) {
            if (pkg[section]?.[pkgName]) {
                report.errors.push(message)
                break
            }
        }
    }

    // Check Node.js engine requirement
    const engines = pkg.engines?.node
    if (engines) {
        const currentMin = semver.minVersion(engines)
        if (currentMin && semver.lt(currentMin, MIN_NODE_VERSION)) {
            report.warnings.push(
                `\`engines.node\` is \`${engines}\` — TypeORM v1 requires Node.js ${MIN_NODE_VERSION}+. Update your engines field.`,
            )
        }
    }

    // Check for dotenv (soft warning)
    for (const section of depSections) {
        if (pkg[section]?.dotenv) {
            report.warnings.push(
                `\`dotenv\` detected — TypeORM v1 no longer auto-loads \`.env\` files. Make sure your app loads environment variables itself (e.g. via \`dotenv/config\` import).`,
            )
            break
        }
    }

    if (modified && !dry) {
        // Preserve original formatting (detect indent)
        const indent = detectIndent(raw)
        fs.writeFileSync(
            filePath,
            JSON.stringify(pkg, null, indent) + "\n",
            "utf8",
        )
    }

    return report
}

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
            // Check root package.json
            const rootPkg = path.join(p, "package.json")
            if (fs.existsSync(rootPkg)) results.push(rootPkg)

            // Check packages/*/package.json (monorepo)
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

/** Detect indentation from a JSON string. */
const detectIndent = (json: string): number => {
    const match = json.match(/^(\s+)"/m)
    return match ? match[1].length : 2
}
