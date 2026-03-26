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

type Section = (typeof sections)[number]

const getDeps = (
    pkg: PackageJson,
    section: Section,
): Record<string, string> | undefined => pkg[section]

const findInAnySection = (pkg: PackageJson, pkgName: string): boolean =>
    sections.some((s) => getDeps(pkg, s)?.[pkgName])

const isStandardVersion = (version: string): boolean =>
    !version.includes(":") &&
    !version.startsWith("file:") &&
    !version.startsWith("link:") &&
    semver.validRange(version) !== null

const replacePackages = (
    pkg: PackageJson,
    config: DependencyConfig,
    report: DependencyReport,
): boolean => {
    let modified = false

    for (const [oldPkg, { replacement, version }] of Object.entries(
        config.replacements,
    )) {
        for (const section of sections) {
            const deps = getDeps(pkg, section)
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

    return modified
}

const upgradePackages = (
    pkg: PackageJson,
    config: DependencyConfig,
    report: DependencyReport,
): boolean => {
    let modified = false

    for (const [pkgName, { minVersion, version }] of Object.entries(
        config.upgrades,
    )) {
        for (const section of sections) {
            const deps = getDeps(pkg, section)
            const current = deps?.[pkgName]
            if (!deps || !current) continue

            if (!isStandardVersion(current)) {
                report.errors.push(
                    `\`${pkgName}\` has non-standard version specifier \`${current}\` — needs manual upgrade`,
                )
                continue
            }

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

    return modified
}

const checkIncompatible = (
    pkg: PackageJson,
    config: DependencyConfig,
    report: DependencyReport,
): void => {
    for (const [pkgName, message] of Object.entries(config.incompatible)) {
        if (findInAnySection(pkg, pkgName)) {
            report.errors.push(message)
        }
    }
}

const checkNodeVersion = (
    pkg: PackageJson,
    config: DependencyConfig,
    report: DependencyReport,
): void => {
    const engines = pkg.engines?.node
    if (!engines) return

    const currentMin = semver.minVersion(engines)
    if (currentMin && semver.lt(currentMin, config.minNodeVersion)) {
        report.warnings.push(
            `\`engines.node\` is \`${engines}\` — TypeORM requires Node.js ${config.minNodeVersion}+. Update your engines field.`,
        )
    }
}

const checkWarnings = (
    pkg: PackageJson,
    config: DependencyConfig,
    report: DependencyReport,
): void => {
    for (const [pkgName, message] of Object.entries(config.warnings)) {
        if (findInAnySection(pkg, pkgName)) {
            report.warnings.push(message)
        }
    }
}

const detectIndent = (json: string): number => {
    const match = /^( +)"/m.exec(json)
    return match ? match[1].length : 2
}

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

    let raw: string
    let pkg: PackageJson
    try {
        raw = fs.readFileSync(filePath, "utf8")
        pkg = JSON.parse(raw) as PackageJson
    } catch (err) {
        report.errors.push(
            `failed to read \`${filePath}\`: ${err instanceof Error ? err.message : String(err)}`,
        )
        return report
    }

    const replaced = replacePackages(pkg, config, report)
    const upgraded = upgradePackages(pkg, config, report)
    const modified = replaced || upgraded

    checkIncompatible(pkg, config, report)
    checkNodeVersion(pkg, config, report)
    checkWarnings(pkg, config, report)

    if (modified && !dry) {
        try {
            const indent = detectIndent(raw)
            fs.writeFileSync(
                filePath,
                JSON.stringify(pkg, null, indent) + "\n",
                "utf8",
            )
        } catch (err) {
            report.errors.push(
                `failed to write \`${filePath}\`: ${err instanceof Error ? err.message : String(err)}`,
            )
        }
    }

    return report
}
