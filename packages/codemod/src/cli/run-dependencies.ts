import { colors } from "../lib/colors"
import { createSpinner } from "../lib/spinner"
import { formatTime } from "../lib/format-time"
import { highlight } from "../lib/highlight"
import {
    type DependencyReport,
    findPackageJsonFiles,
    getConfig,
    upgradeDependencies,
} from "../dependencies"

export interface DependencyResult {
    changes: string[]
    reports: DependencyReport[]
}

export const runDependencies = (
    paths: string[],
    version: string,
    dry: boolean,
): DependencyResult | undefined => {
    const depConfig = getConfig(version)
    if (!depConfig) return undefined

    const packageJsonFiles = findPackageJsonFiles(paths)
    if (packageJsonFiles.length === 0) return undefined

    const depSpinner = createSpinner(
        `Upgrading dependencies in ${packageJsonFiles.length} package.json file${packageJsonFiles.length === 1 ? "" : "s"}...`,
    )
    const depStart = Date.now()
    let depFilesChanged = 0
    const reports: DependencyReport[] = []
    const changes: string[] = []

    for (const file of packageJsonFiles) {
        const report = upgradeDependencies(file, dry, depConfig)
        if (report.changes.length > 0) depFilesChanged++
        changes.push(...report.changes)
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
            console.log(`  ${colors.yellow("Warning:")} ${highlight(w)}`),
        )
        report.errors.forEach((e) =>
            console.log(`  ${colors.red("Error:")} ${highlight(e)}`),
        )
    }

    return { changes, reports }
}
