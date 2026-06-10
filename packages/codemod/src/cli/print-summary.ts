import { colors } from "../lib/colors"
import { formatTime } from "../lib/format-time"
import { highlight } from "../lib/highlight"
import { printTodos } from "./print-todos"

export interface SummaryData {
    ok: number
    error: number
    skip: number
    nochange: number
    timeElapsed: number
    parseErrors: { file: string; message: string }[]
    todos: Map<string, string[]>
    applied: Map<string, number>
    depChanges: string[]
    depWarnings: string[]
    depErrors: string[]
}

const printStatistics = (data: SummaryData): void => {
    console.log(`\n${colors.bold("Statistics:")}`)
    console.log(
        `  Files processed:   ${data.ok + data.error + data.skip + data.nochange}`,
    )
    console.log(`  Files transformed: ${data.ok}`)
    console.log(`  Files skipped:     ${data.skip + data.nochange}`)
    console.log(`  Parse errors:      ${data.error}`)
    console.log(`  Time elapsed:      ${formatTime(data.timeElapsed)}`)
}

const printApplied = (applied: Map<string, number>): void => {
    console.log(`\n${colors.bold("Transforms applied:")}`)
    const sorted = [...applied.entries()].sort(([, a], [, b]) => b - a)
    for (const [name, count] of sorted) {
        console.log(
            `  ${colors.dim(name.padEnd(45))} ${count} file${count === 1 ? "" : "s"}`,
        )
    }
}

const printParseErrors = (
    parseErrors: { file: string; message: string }[],
): void => {
    console.log(`\n  ${colors.red("Parse errors:")}`)
    const sorted = [...parseErrors].sort((a, b) => a.file.localeCompare(b.file))
    for (const { file, message } of sorted) {
        console.log(`    ${colors.dim(file)} ${message}`)
    }
}

const groupLines = (lines: string[]): [string, number][] => {
    const counts = new Map<string, number>()
    for (const line of lines) {
        counts.set(line, (counts.get(line) ?? 0) + 1)
    }
    return [...counts.entries()]
}

const printGrouped = (
    lines: string[],
    indent: string,
    formatter: (line: string) => string = highlight,
): void => {
    for (const [line, count] of groupLines(lines)) {
        const timesLabel = `(${count} times)`
        const countSuffix = count > 1 ? ` ${colors.dim(timesLabel)}` : ""
        console.log(`${indent}${formatter(line)}${countSuffix}`)
    }
}

const printDependencyChanges = (
    changes: string[],
    warnings: string[],
    errors: string[],
): void => {
    console.log(`\n${colors.bold("Dependency changes:")}`)
    printGrouped(changes, "  ")
    if (errors.length > 0) {
        console.log(`\n  ${colors.red("Errors:")}`)
        printGrouped(errors, "    ")
    }
    if (warnings.length > 0) {
        console.log(`\n  ${colors.yellow("Warnings:")}`)
        printGrouped(warnings, "    ")
    }
}

export const printSummary = (data: SummaryData): void => {
    printStatistics(data)

    if (data.applied.size > 0) printApplied(data.applied)
    if (data.todos.size > 0) printTodos(data.todos)
    if (data.parseErrors.length > 0) printParseErrors(data.parseErrors)

    if (
        data.depChanges.length > 0 ||
        data.depWarnings.length > 0 ||
        data.depErrors.length > 0
    ) {
        printDependencyChanges(
            data.depChanges,
            data.depWarnings,
            data.depErrors,
        )
    }
}
