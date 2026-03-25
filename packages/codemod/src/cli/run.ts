import path from "node:path"
import { run as jscodeshift } from "jscodeshift/src/Runner"
import { colors } from "./colors"
import { printTodos } from "./print-todos"
import { collectTodos } from "../transforms/todo"
import { collectApplied } from "../transforms/transformer"
import { versions } from "../transforms"
import {
    type DependencyReport,
    findPackageJsonFiles,
    getConfig,
    upgradeDependencies,
} from "../dependencies"

interface RunResult {
    ok: number
    error: number
    nochange: number
    skip: number
    timeElapsed: string
    stats: Record<string, number>
}

const printReport = (report: DependencyReport): void => {
    if (report.changes.length > 0) {
        console.log(`\n  ${colors.dim(report.file)}:`)
        report.changes.forEach((c) => console.log(`    ${c}`))
    }
    report.warnings.forEach((w) =>
        console.log(`  ${colors.yellow("Warning:")} ${w}`),
    )
    report.errors.forEach((e) => console.log(`  ${colors.red("Error:")} ${e}`))
}

const camelToKebab = (s: string): string =>
    s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()

export const runTransforms = async (
    transforms: string[],
    paths: string[],
    dry: boolean,
    version: string,
    workers?: number,
    stats?: boolean,
): Promise<void> => {
    const ext = transforms[0]?.endsWith(".ts") ? ".ts" : ".js"
    const allTodos = new Map<string, string[]>()
    const allApplied = new Map<string, number>()
    let totalOk = 0
    let totalError = 0
    let totalSkip = 0
    let totalNochange = 0
    let totalTime = 0

    for (const transform of transforms) {
        const name = path.basename(transform, ext)
        console.log(`\nRunning transform: ${name}`)

        const result = (await jscodeshift(transform, paths, {
            dry,
            print: false,
            verbose: 0,
            extensions: "ts,tsx,js,jsx",
            parser: "tsx",
            ...(workers !== undefined && { cpus: workers }),
        })) as RunResult

        totalOk += result.ok
        totalError += result.error
        totalSkip += result.skip
        totalNochange += result.nochange
        totalTime += parseFloat(result.timeElapsed)

        for (const [transform, files] of collectTodos(result.stats ?? {})) {
            const existing = allTodos.get(transform) ?? []
            existing.push(...files)
            allTodos.set(transform, existing)
        }

        for (const [name, count] of collectApplied(result.stats ?? {})) {
            allApplied.set(name, (allApplied.get(name) ?? 0) + count)
        }
    }

    // Upgrade package.json dependencies
    const depConfig = getConfig(version)
    const depChanges: string[] = []
    if (depConfig) {
        const packageJsonFiles = findPackageJsonFiles(paths)
        if (packageJsonFiles.length > 0) {
            console.log(
                `\nUpgrading dependencies in ${packageJsonFiles.length} package.json file(s)`,
            )
            for (const file of packageJsonFiles) {
                const report = upgradeDependencies(file, dry, depConfig)
                printReport(report)
                depChanges.push(...report.changes)
            }
        }
    }

    if (!dry) {
        console.log(
            `\n${colors.blue("Tip:")} run your project's formatter (e.g. Prettier, ESLint with --fix) to clean up any minor style differences introduced by the codemod.`,
        )

        const guide = versions[version]?.migrationGuide
        if (guide) {
            console.log(
                `\nSee the full migration guide for details: ${colors.blue(guide)}`,
            )
        }
    }

    if (!dry && allTodos.size > 0) {
        printTodos(allTodos)
    }

    if (stats) {
        console.log(`\n${colors.bold("Statistics:")}`)
        console.log(
            `  Files processed:   ${totalOk + totalError + totalSkip + totalNochange}`,
        )
        console.log(`  Files transformed: ${totalOk}`)
        console.log(`  Files skipped:     ${totalSkip + totalNochange}`)
        console.log(`  Parse errors:      ${totalError}`)
        console.log(`  Time elapsed:      ${totalTime.toFixed(1)}s`)

        if (allApplied.size > 0) {
            console.log(`\n${colors.bold("Transforms applied:")}`)
            const sorted = [...allApplied.entries()].sort(
                ([, a], [, b]) => b - a,
            )
            for (const [name, count] of sorted) {
                console.log(
                    `  ${colors.dim(camelToKebab(name).padEnd(45))} ${count} file${count === 1 ? "" : "s"}`,
                )
            }
        }

        if (depChanges.length > 0) {
            console.log(`\n${colors.bold("Dependency changes:")}`)
            for (const change of depChanges) {
                console.log(`  ${change}`)
            }
        }
    }
}
