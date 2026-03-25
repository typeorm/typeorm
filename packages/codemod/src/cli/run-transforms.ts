import { run as jscodeshift } from "jscodeshift/src/Runner"
import { colors } from "../lib/colors"
import { createSpinner } from "../lib/spinner"
import { formatTime } from "../lib/format-time"
import { stats } from "../transforms/stats"

interface JscodeshiftResult {
    ok: number
    error: number
    nochange: number
    skip: number
    timeElapsed: string
    stats: Record<string, number>
}

export interface TransformResult {
    ok: number
    error: number
    skip: number
    nochange: number
    timeElapsed: number
    parseErrors: { file: string; message: string }[]
    todos: Map<string, string[]>
    applied: Map<string, number>
}

export interface RunTransformsOptions {
    transforms: string[]
    paths: string[]
    dry: boolean
    workers?: number
    ignore?: string[]
}

export const runTransforms = async (
    options: RunTransformsOptions,
): Promise<TransformResult> => {
    const { transforms, paths, dry, workers, ignore } = options
    const allTodos = new Map<string, string[]>()
    const allApplied = new Map<string, number>()
    const allParseErrors: { file: string; message: string }[] = []
    let totalOk = 0
    let totalError = 0
    let totalSkip = 0
    let totalNochange = 0
    let totalTime = 0

    for (const transform of transforms) {
        let fileCount = 0
        let processed = 0
        let startTime = 0
        const spinner = createSpinner("Scanning files...")

        const progressText = () => {
            const elapsed = (Date.now() - startTime) / 1000
            let text = `Processing ${processed}/${fileCount} files... ${colors.dim(formatTime(elapsed))}`
            if (processed > 0 && processed < fileCount) {
                const remaining =
                    (elapsed / processed) * (fileCount - processed)
                text += colors.dim(` (ETA: ${formatTime(remaining)})`)
            }
            return text
        }

        // Intercept stdout to capture jscodeshift progress
        const parseErrors: { file: string; message: string }[] = []
        const originalWrite = process.stdout.write.bind(process.stdout)
        process.stdout.write = ((chunk: string | Uint8Array) => {
            const str = typeof chunk === "string" ? chunk : chunk.toString()

            // Capture file count from jscodeshift's "Processing N files..."
            const countMatch = /Processing (\d+) files/.exec(str)
            if (countMatch) {
                fileCount = parseInt(countMatch[1], 10)
                startTime = Date.now()
                spinner.update(`Processing 0/${fileCount} files...`)
                return true
            }

            // Track per-file completion and collect errors
            if (str.includes(" ERR ")) {
                processed++
                const errMatch =
                    / ERR (.+?) Transformation error \((.+)\)/.exec(str)
                if (errMatch) {
                    parseErrors.push({
                        file: errMatch[1],
                        message: errMatch[2],
                    })
                }
            } else if (
                str.includes(" OKK ") ||
                str.includes(" NOC ") ||
                str.includes(" SKIP ")
            ) {
                processed++
            } else {
                // Suppress other jscodeshift output (including stack traces)
                return true
            }

            spinner.update(progressText)
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
        })) as JscodeshiftResult

        process.stdout.write = originalWrite

        const elapsed = parseFloat(result.timeElapsed)
        const total = result.ok + result.error + result.skip + result.nochange
        const errorSuffix = result.error > 0 ? `, ${result.error} errors` : ""
        spinner.stop(
            `${colors.green("✔")} Changed ${result.ok} out of ${total} files (${formatTime(elapsed)})${errorSuffix}`,
        )

        totalOk += result.ok
        totalError += result.error
        allParseErrors.push(...parseErrors)
        totalSkip += result.skip
        totalNochange += result.nochange
        totalTime += parseFloat(result.timeElapsed)

        for (const [transform, files] of stats.collect.todos(
            result.stats ?? {},
        )) {
            const existing = allTodos.get(transform) ?? []
            existing.push(...files)
            allTodos.set(transform, existing)
        }

        for (const [name, count] of stats.collect.applied(result.stats ?? {})) {
            allApplied.set(name, (allApplied.get(name) ?? 0) + count)
        }
    }

    return {
        ok: totalOk,
        error: totalError,
        skip: totalSkip,
        nochange: totalNochange,
        timeElapsed: totalTime,
        parseErrors: allParseErrors,
        todos: allTodos,
        applied: allApplied,
    }
}
