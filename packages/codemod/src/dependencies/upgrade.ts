import fs from "node:fs"
import semver from "semver"
import type { DependencyConfig, DependencyReport } from "./config"

export interface PackageJson {
    engines?: { node?: string }
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    optionalDependencies?: Record<string, string>
}

const sections = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
] as const

export const upgradeDependencies = (
    filePath: string,
    dry: boolean,
    config: DependencyConfig,
): DependencyReport => {
    const report: DependencyReport = {
        file: filePath,
        changes: [],
        warnings: [],
        errors: [],
    }

    const raw = fs.readFileSync(filePath, "utf8")
    const pkg: PackageJson = JSON.parse(raw)
    let modified = false

    const getDeps = (section: (typeof sections)[number]) => pkg[section]

    // Replace deprecated packages
    for (const [oldPkg, { replacement, version }] of Object.entries(
        config.replacements,
    )) {
        for (const section of sections) {
            const deps = getDeps(section)
            if (!deps?.[oldPkg]) continue

            delete deps[oldPkg]
            if (deps[replacement]) {
                report.changes.push(
                    `${section}: removed \`${oldPkg}\` (${replacement} already present)`,
                )
            } else {
                deps[replacement] = version
                report.changes.push(
                    `${section}: replaced \`${oldPkg}\` with \`${replacement}@${version}\``,
                )
            }
            modified = true
        }
    }

    // Upgrade packages below minimum version
    for (const [pkgName, { minVersion, version }] of Object.entries(
        config.upgrades,
    )) {
        for (const section of sections) {
            const deps = getDeps(section)
            const current = deps?.[pkgName]
            if (!deps || !current) continue

            const currentMin = semver.minVersion(current)
            const requiredMin = semver.minVersion(minVersion)
            if (
                currentMin &&
                requiredMin &&
                semver.lt(currentMin, requiredMin)
            ) {
                deps[pkgName] = version
                report.changes.push(
                    `${section}: bumped \`${pkgName}\` from \`${current}\` to \`${version}\``,
                )
                modified = true
            }
        }
    }

    // Check for incompatible packages (hard errors)
    for (const [pkgName, message] of Object.entries(config.incompatible)) {
        for (const section of sections) {
            if (getDeps(section)?.[pkgName]) {
                report.errors.push(message)
                break
            }
        }
    }

    // Check Node.js engine requirement
    const engines = pkg.engines?.node
    if (engines) {
        const currentMin = semver.minVersion(engines)
        if (currentMin && semver.lt(currentMin, config.minNodeVersion)) {
            report.warnings.push(
                `\`engines.node\` is \`${engines}\` — TypeORM requires Node.js ${config.minNodeVersion}+. Update your engines field.`,
            )
        }
    }

    // Check for packages that trigger soft warnings
    for (const [pkgName, message] of Object.entries(config.warnings)) {
        for (const section of sections) {
            if (getDeps(section)?.[pkgName]) {
                report.warnings.push(message)
                break
            }
        }
    }

    if (modified && !dry) {
        const indent = detectIndent(raw)
        fs.writeFileSync(
            filePath,
            JSON.stringify(pkg, null, indent) + "\n",
            "utf8",
        )
    }

    return report
}

const detectIndent = (json: string): number => {
    const match = /^( +)"/m.exec(json)
    return match ? match[1].length : 2
}
