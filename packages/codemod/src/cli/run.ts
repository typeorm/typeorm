import path from "node:path"
import { run as jscodeshift } from "jscodeshift/src/Runner"
import { colors } from "./colors"
import { collectTodos } from "../transforms/todo"
import { versions } from "../transforms"
import {
    type DependencyReport,
    findPackageJsonFiles,
    upgradeDependencies,
} from "../transforms/v1/upgrade-dependencies"

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

const printTodos = (allTodos: Map<string, string[]>): void => {
    console.log(
        `\n${colors.yellow("Warning:")} the following files contain TODO comments that need manual review:\n`,
    )
    for (const [transform, files] of allTodos) {
        console.log(`  ${colors.dim(transform)}:`)
        files.forEach((f) => console.log(`    ${f}`))
    }
    console.log()
}

export const runTransforms = async (
    transforms: string[],
    paths: string[],
    dry: boolean,
    version: string,
): Promise<void> => {
    const ext = transforms[0]?.endsWith(".ts") ? ".ts" : ".js"
    const allTodos = new Map<string, string[]>()

    for (const transform of transforms) {
        const name = path.basename(transform, ext)
        console.log(`\nRunning transform: ${name}`)

        const result = await jscodeshift(transform, paths, {
            dry,
            print: false,
            verbose: 0,
            extensions: "ts,tsx,js,jsx",
            parser: "tsx",
        })

        for (const [transform, files] of collectTodos(result.stats ?? {})) {
            const existing = allTodos.get(transform) ?? []
            existing.push(...files)
            allTodos.set(transform, existing)
        }
    }

    // Upgrade package.json dependencies
    const packageJsonFiles = findPackageJsonFiles(paths)
    if (packageJsonFiles.length > 0) {
        console.log(
            `\nUpgrading dependencies in ${packageJsonFiles.length} package.json file(s)`,
        )
        for (const file of packageJsonFiles) {
            printReport(upgradeDependencies(file, dry))
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
}
