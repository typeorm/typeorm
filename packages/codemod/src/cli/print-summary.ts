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

export const printSummary = (data: SummaryData): void => {
    const {
        ok,
        error,
        skip,
        nochange,
        timeElapsed,
        parseErrors,
        todos,
        applied,
        depChanges,
        depWarnings,
        depErrors,
    } = data

    console.log(`\n${colors.bold("Statistics:")}`)
    console.log(`  Files processed:   ${ok + error + skip + nochange}`)
    console.log(`  Files transformed: ${ok}`)
    console.log(`  Files skipped:     ${skip + nochange}`)
    console.log(`  Parse errors:      ${error}`)
    console.log(`  Time elapsed:      ${formatTime(timeElapsed)}`)

    if (applied.size > 0) {
        console.log(`\n${colors.bold("Transforms applied:")}`)
        const sorted = [...applied.entries()].sort(([, a], [, b]) => b - a)
        for (const [name, count] of sorted) {
            console.log(
                `  ${colors.dim(name.padEnd(45))} ${count} file${count === 1 ? "" : "s"}`,
            )
        }
    }

    if (todos.size > 0) {
        printTodos(todos)
    }

    if (parseErrors.length > 0) {
        console.log(`\n  ${colors.red("Parse errors:")}`)
        for (const { file, message } of parseErrors) {
            console.log(`    ${colors.dim(file)} ${message}`)
        }
    }

    if (
        depChanges.length > 0 ||
        depWarnings.length > 0 ||
        depErrors.length > 0
    ) {
        console.log(`\n${colors.bold("Dependency changes:")}`)
        for (const change of depChanges) {
            console.log(`  ${highlight(change)}`)
        }
        if (depWarnings.length > 0) {
            console.log(`\n  ${colors.yellow("Warnings:")}`)
            for (const w of depWarnings) {
                console.log(`    ${highlight(w)}`)
            }
        }
        if (depErrors.length > 0) {
            console.log(`\n  ${colors.red("Errors:")}`)
            for (const e of depErrors) {
                console.log(`    ${highlight(e)}`)
            }
        }
    }
}
