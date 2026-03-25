import { run as jscodeshift } from "jscodeshift/src/Runner"
import { colors } from "./colors"
import { createSpinner } from "./spinner"
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

const highlight = (text: string): string =>
    text.replace(/`([^`]+)`/g, (_, content: string) => colors.dim(content))

const camelToKebab = (s: string): string =>
    s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()

const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export interface RunOptions {
    transforms: string[]
    paths: string[]
    dry: boolean
    version: string
    workers?: number
    ignore?: string[]
}

export const runTransforms = async (options: RunOptions): Promise<void> => {
    const { transforms, paths, dry, version, workers, ignore } = options
    const allTodos = new Map<string, string[]>()
    const allApplied = new Map<string, number>()
    let totalOk = 0
    let totalError = 0
    let totalSkip = 0
    let totalNochange = 0
    let totalTime = 0

    for (const transform of transforms) {
        let fileCount = 0
        let processed = 0
        const spinner = createSpinner("Scanning files...")

        // Intercept stdout to capture jscodeshift progress
        const errors: string[] = []
        const originalWrite = process.stdout.write.bind(process.stdout)
        process.stdout.write = ((chunk: string | Uint8Array) => {
            const str = typeof chunk === "string" ? chunk : chunk.toString()

            // Capture file count from jscodeshift's "Processing N files..."
            const countMatch = /Processing (\d+) files/.exec(str)
            if (countMatch) {
                fileCount = parseInt(countMatch[1], 10)
                spinner.update(`Processing 0/${fileCount} files...`)
                return true
            }

            // Track per-file completion and collect errors
            if (str.includes(" ERR ")) {
                processed++
                errors.push(str.trim())
            } else if (
                str.includes(" OKK ") ||
                str.includes(" NOC ") ||
                str.includes(" SKIP ")
            ) {
                processed++
            } else {
                // Suppress other jscodeshift output
                return true
            }

            spinner.update(`Processing ${processed}/${fileCount} files...`)
            return true
        }) as typeof process.stdout.write

        const result = (await jscodeshift(transform, paths, {
            dry,
            print: false,
            verbose: 2,
            extensions: "ts,tsx,js,jsx",
            parser: "tsx",
            ...(workers !== undefined && { cpus: workers }),
            ...(ignore !== undefined && { ignorePattern: ignore }),
        })) as RunResult

        process.stdout.write = originalWrite

        const elapsed = parseFloat(result.timeElapsed)
        const total = result.ok + result.error + result.skip + result.nochange
        const errorSuffix = result.error > 0 ? `, ${result.error} errors` : ""
        spinner.stop(
            `${colors.green("✔")} Changed ${result.ok} out of ${total} files (${formatTime(elapsed)})${errorSuffix}`,
        )
        for (const err of errors) {
            console.log(`  ${err}`)
        }

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
            const depSpinner = createSpinner(
                `Upgrading dependencies in ${packageJsonFiles.length} package.json file${packageJsonFiles.length === 1 ? "" : "s"}...`,
            )
            const depStart = Date.now()
            let depFilesChanged = 0
            const reports: DependencyReport[] = []
            for (const file of packageJsonFiles) {
                const report = upgradeDependencies(file, dry, depConfig)
                if (report.changes.length > 0) depFilesChanged++
                depChanges.push(...report.changes)
                reports.push(report)
            }
            const depElapsed = (Date.now() - depStart) / 1000
            const depSummary =
                packageJsonFiles.length === 1
                    ? depFilesChanged === 1
                        ? "Updated one package.json file"
                        : "No package.json changes needed"
                    : `Updated ${depFilesChanged} out of ${packageJsonFiles.length} package.json files`
            depSpinner.stop(
                `${colors.green("✔")} ${depSummary} (${formatTime(depElapsed)})`,
            )
            for (const report of reports) {
                report.warnings.forEach((w) =>
                    console.log(
                        `  ${colors.yellow("Warning:")} ${highlight(w)}`,
                    ),
                )
                report.errors.forEach((e) =>
                    console.log(`  ${colors.red("Error:")} ${highlight(e)}`),
                )
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

    console.log(`\n${colors.bold("Statistics:")}`)
    console.log(
        `  Files processed:   ${totalOk + totalError + totalSkip + totalNochange}`,
    )
    console.log(`  Files transformed: ${totalOk}`)
    console.log(`  Files skipped:     ${totalSkip + totalNochange}`)
    console.log(`  Parse errors:      ${totalError}`)
    console.log(`  Time elapsed:      ${formatTime(totalTime)}`)

    if (allApplied.size > 0) {
        console.log(`\n${colors.bold("Transforms applied:")}`)
        const sorted = [...allApplied.entries()].sort(([, a], [, b]) => b - a)
        for (const [name, count] of sorted) {
            console.log(
                `  ${colors.dim(camelToKebab(name).padEnd(45))} ${count} file${count === 1 ? "" : "s"}`,
            )
        }
    }

    if (depChanges.length > 0) {
        console.log(`\n${colors.bold("Dependency changes:")}`)
        for (const change of depChanges) {
            console.log(`  ${highlight(change)}`)
        }
    }
}
