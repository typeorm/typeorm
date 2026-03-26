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
    for (const { file, message } of parseErrors) {
        console.log(`    ${colors.dim(file)} ${message}`)
    }
}

const printDependencyChanges = (
    changes: string[],
    warnings: string[],
    errors: string[],
): void => {
    console.log(`\n${colors.bold("Dependency changes:")}`)
    for (const change of changes) {
        console.log(`  ${highlight(change)}`)
    }
    if (warnings.length > 0) {
        console.log(`\n  ${colors.yellow("Warnings:")}`)
        for (const w of warnings) {
            console.log(`    ${highlight(w)}`)
        }
    }
    if (errors.length > 0) {
        console.log(`\n  ${colors.red("Errors:")}`)
        for (const e of errors) {
            console.log(`    ${highlight(e)}`)
        }
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
